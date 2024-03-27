import { IQueryTypeRules } from "../../types/QueryModels";
import { queryRules } from "./QueryRules";
import * as _ from "lodash";
import moment from "moment";
import { getDatasourceList } from "../../services/DatasourceService";
import logger from "../../logger";
import { getDatasourceListFromDruid } from "../../connections/druidConnection";

const momentFormat = "YYYY-MM-DD HH:MM:SS";

export const validateQuery = async (requestPayload: any) => {
    const query = requestPayload?.query;
    const isValid = (_.isObject(query)) ? validateNativeQuery(requestPayload) : (_.isString(query)) ? validateSqlQuery(requestPayload) : false;
    const datasource = getDataSourceFromPayload(requestPayload);
    if (isValid === true) {
        return setDatasourceRef(datasource, requestPayload);
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
            return dataSource.replace(/"/g, "");
        }
    }
    if (_.isObject(queryPayload.query)) {
        const dataSourceField: any = _.get(queryPayload, "query.dataSource", '');
        return dataSourceField;
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
        logger.error(`Data range cannnot be more than ${allowedRange} days.`)
        return { message: `Invalid date range! make sure your range cannot be more than ${allowedRange} days`, statusCode: 400, errCode: "BAD_REQUEST" };
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
        : { message: "Invalid date range! the date range cannot be a null value", statusCode: 400, errCode: "BAD_REQUEST" };
};

const getDataSourceRef = async (datasourceName: string, granularity?: string) => {
    const dataSources = await getDatasourceList(datasourceName)
    if (_.isEmpty(dataSources)) {
        logger.error(`Datasource ${datasourceName} not available in datasource live table`)
        return { message: `Datasource ${datasourceName} not available for querying`, statusCode: 404, errCode: "NOT_FOUND" };
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

const setDatasourceRef = async (dataSourceName: string, payload: any): Promise<any> => {
    try {
        const granularity = _.get(payload, 'context.granularity')
        const datasourceRef = await getDataSourceRef(dataSourceName, granularity);
        const datasource = await validateDatasource(datasourceRef);
        if (datasource) {
            logger.error(`Datasource ${datasource} not available for querying in druid`)
            return { message: `Datasource ${datasource} not available for querying`, statusCode: 404, errCode: "NOT_FOUND" };
        }
        if (_.isString(payload?.query)) {
            payload.query = payload.query.replace(dataSourceName, datasourceRef)
        }
        if (_.isObject(payload?.query)) {
            payload.query.dataSource = datasourceRef
        }
        return true;
    } catch (error: any) {
        return { message: `Error while fetching datasource record`, statusCode: 404, errCode: "NOT_FOUND" };
    }
}