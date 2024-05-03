import { IQueryTypeRules } from "../../types/QueryModels";
import { queryRules } from "./QueryRules";
import * as _ from "lodash";
import moment from "moment";
import { getDatasourceList } from "../../services/DatasourceService";
import logger from "../../logger";
import { getDatasourceListFromDruid } from "../../connections/druidConnection";
import { apiId } from "./DataOutController";

const momentFormat = "YYYY-MM-DD HH:MM:SS";
let dataset_id: string;
const errCode = {
    notFound: "DATA_OUT_SOURCE_NOT_FOUND",
    invalidDateRange: "DATA_OUT_INVALID_DATE_RANGE"
}

export const validateQuery = async (requestPayload: any, datasetId: string) => {
    dataset_id = datasetId;
    const query = requestPayload?.query;
    const isValid = (_.isObject(query)) ? validateNativeQuery(requestPayload) : (_.isString(query)) ? validateSqlQuery(requestPayload) : false;
    const datasetName = getDataSourceFromPayload(requestPayload);
    if (isValid === true) {
        return setDatasourceRef(datasetName, requestPayload);
    }
    return isValid;
}

const validateNativeQuery = (data: any) => {
    setQueryLimits(data)
    const dataSourceLimits: any = getDataSourceLimits(getDataSourceFromPayload(data));
    if (!_.isEmpty(dataSourceLimits) && dataSourceLimits !== undefined) {
        const isValidDate = validateQueryRules(data, dataSourceLimits.queryRules[data.query.queryType as keyof IQueryTypeRules])
        return isValidDate
    }
    return true;
}

const validateSqlQuery = (data: any) => {
    setQueryLimits(data);
    const dataSourceLimits: any = getDataSourceLimits(getDataSourceFromPayload(data));
    if (!_.isEmpty(dataSourceLimits) && dataSourceLimits !== undefined) {
        const isValidDate = validateQueryRules(data, dataSourceLimits.queryRules.scan)
        return isValidDate
    }
    return true;
}

const getLimit = (queryLimit: number, maxRowLimit: number) => {
    return queryLimit > maxRowLimit ? maxRowLimit : queryLimit;
};

const setQueryLimits = (queryPayload: any) => {
    if (_.isObject(queryPayload?.query)) {
        const threshold = _.get(queryPayload, "query.threshold")
        if (threshold) {
            const maxThreshold = getLimit(threshold, queryRules.common.maxResultThreshold)
            _.set(queryPayload, "query.threshold", maxThreshold)
        }
        else {
            _.set(queryPayload, "query.threshold", queryRules.common.maxResultThreshold)
        }

        const scanLimit = _.get(queryPayload, "query.limit");
        if (scanLimit) {
            const maxSacnLimit = getLimit(scanLimit, queryRules.common.maxResultRowLimit)
            _.set(queryPayload, "query.limit", maxSacnLimit)
        }
        else {
            _.set(queryPayload, "query.threshold", queryRules.common.maxResultRowLimit)
        }
    }

    if (_.isString(queryPayload?.query)) {
        const vocabulary = queryPayload?.query.split(" ");
        const isLimitPresent = _.includes(vocabulary, "{{LIMIT}}") || _.includes(vocabulary, "LIMIT")
        if (isLimitPresent) {
            return queryPayload?.query
        }
        const queryLimitIndex = vocabulary.indexOf("LIMIT");
        const queryLimit = Number(vocabulary[queryLimitIndex + 1]);
        if (isNaN(queryLimit)) {
            const updatedVocabulary = [...vocabulary, "LIMIT", queryRules.common.maxResultRowLimit].join(" ");
            queryPayload.query = updatedVocabulary;
        } else {
            const newLimit = getLimit(queryLimit, queryRules.common.maxResultRowLimit);
            vocabulary[queryLimitIndex + 1] = newLimit.toString();
            queryPayload.query = vocabulary.join(" ");
        }
    }
}

const getDataSourceFromPayload = (queryPayload: any) => {
    if (_.isString(queryPayload.query)) {
        let query = queryPayload.query;
        query = query.replace(/\s+/g, " ").trim();
        const fromIndex = query.indexOf("FROM");
        let dataSource = query.substring(fromIndex).split(" ")[1];
        if (fromIndex !== -1 && dataSource) {
            dataSource = dataSource.replace(/\\/g, "");
            return dataset_id || dataSource.replace(/"/g, "");
        }
    }
    if (_.isObject(queryPayload.query)) {
        const dataSourceField: any = _.get(queryPayload, "query.datasetId", '');
        return dataset_id || dataSourceField;
    }
}

const getDataSourceLimits = (datasource: string) => {
    const rules = _.get(queryRules, "rules") || [];
    return _.find(rules, { dataset: datasource });
};

const getIntervals = (payload: any) => {
    if (_.isObject(payload.intervals) && !_.isArray(payload.intervals)) {
        return payload.intervals.intervals;
    } else {
        return payload.intervals;
    }
};

const isValidDateRange = (
    fromDate: moment.Moment, toDate: moment.Moment, allowedRange: number = 0
): boolean => {
    const differenceInDays = Math.abs(fromDate.diff(toDate, "days"));
    const isValidDates = differenceInDays > allowedRange ? false : true;
    return isValidDates;
};

const validateDateRange = (fromDate: moment.Moment, toDate: moment.Moment, allowedRange: number = 0) => {
    const isValidDates = isValidDateRange(fromDate, toDate, allowedRange);
    if (isValidDates) {
        return true
    }
    else {
        logger.error({ apiId, message: `Data range can not be more than ${allowedRange} days.`, code: errCode.invalidDateRange })
        return { message: `Invalid date range! make sure your range cannot be more than ${allowedRange} days`, statusCode: 400, errCode: "BAD_REQUEST", code: errCode.invalidDateRange };
    }
};

const validateQueryRules = (queryPayload: any, limits: any) => {
    let fromDate: any, toDate: any;
    const allowedRange = limits.maxDateRange;
    if (queryPayload.query && _.isObject(queryPayload.query)) {
        const dateRange = getIntervals(queryPayload.query);
        const extractedDateRange = Array.isArray(dateRange) ? dateRange[0].split("/") : dateRange.toString().split("/");
        fromDate = moment(extractedDateRange[0], momentFormat);
        toDate = moment(extractedDateRange[1], momentFormat);
    }
    else {
        const vocabulary = queryPayload.query.split(" ");
        const fromDateIndex = vocabulary.indexOf("TIMESTAMP");
        const toDateIndex = vocabulary.lastIndexOf("TIMESTAMP");
        fromDate = moment(vocabulary[fromDateIndex + 1], momentFormat);
        toDate = moment(vocabulary[toDateIndex + 1], momentFormat);
    }
    const isValidDates = fromDate && toDate && fromDate.isValid() && toDate.isValid()
    return isValidDates ? validateDateRange(fromDate, toDate, allowedRange)
        : { message: "Invalid date range! the date range cannot be a null value", statusCode: 400, errCode: "BAD_REQUEST", code: errCode.invalidDateRange };
};

const getDataSourceRef = async (datasetId: string, granularity?: string) => {
    const dataSources = await getDatasourceList(datasetId)
    if (_.isEmpty(dataSources)) {
        logger.error({ apiId, message: `Dataset ${datasetId} is not available in datasource live table`, code: errCode.notFound })
        return { message: `Dataset ${datasetId} is not available for querying`, statusCode: 404, errCode: "NOT_FOUND", code: errCode.notFound };
    }
    const record = dataSources.filter((record: any) => {
        const aggregatedRecord = _.get(record, "metadata.aggregated")
        if (granularity)
            return aggregatedRecord && _.get(record, "metadata.granularity") === granularity;
    });
    return record[0]?.dataValues?.datasource_ref
}

const validateDatasource = async (datasource: any) => {
    const existingDatasources = await getDatasourceListFromDruid();
    if (!_.includes(existingDatasources.data, datasource)) {
        logger.error(datasource?.message)
        return datasource
    }
}

const setDatasourceRef = async (datasetId: string, payload: any): Promise<any> => {
    try {
        const granularity = _.get(payload, 'context.table')
        const datasourceRef = await getDataSourceRef(datasetId, granularity);
        const datasource = await validateDatasource(datasourceRef);
        if (_.isObject(datasourceRef)) {
            return datasourceRef
        }
        if (datasource) {
            logger.error({ apiId, message: `Dataset ${datasetId} with table ${granularity} is not available for querying in druid`, code: errCode.notFound })
            return { message: `Dataset ${datasetId} with table ${granularity} is not available for querying`, statusCode: 404, errCode: "NOT_FOUND", code: errCode.notFound };
        }
        if (_.isString(payload?.query)) {
            payload.query = payload.query.replace(datasetId, datasourceRef)
        }
        if (_.isObject(payload?.query)) {
            _.set(payload.query, "dataSource", datasourceRef)
            _.set(payload.query, "granularity", granularity)
        }
        return true;
    } catch (error: any) {
        logger.error({ apiId, message: `Datasource not found`, code: errCode.notFound })
        return { message: `Table not found`, statusCode: 404, errCode: "NOT_FOUND", code: errCode.notFound };
    }
}