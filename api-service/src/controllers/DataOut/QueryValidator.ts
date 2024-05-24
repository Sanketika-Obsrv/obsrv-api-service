import { IQueryTypeRules } from "../../types/QueryModels";
import { queryRules } from "./QueryRules";
import * as _ from "lodash";
import moment from "moment";
import { getDatasourceList } from "../../services/DatasourceService";
import logger from "../../logger";
import { getDatasourceListFromDruid } from "../../connections/druidConnection";
import { apiId } from "./DataOutController";
import { ErrorObject } from "../../types/ResponseModel";
import { Parser } from "node-sql-parser";
const parser = new Parser();

const momentFormat = "YYYY-MM-DD HH:MM:SS";
let dataset_id: string;
let requestBody: any;
let msgid: string;
const errCode = {
    notFound: "DATA_OUT_SOURCE_NOT_FOUND",
    invalidDateRange: "DATA_OUT_INVALID_DATE_RANGE"
}

export const validateQuery = async (requestPayload: any, datasetId: string) => {
    requestBody = requestPayload;
    dataset_id = datasetId;
    msgid = _.get(requestPayload, "params.msgid");
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
        const vocabulary: any = parser.astify(queryPayload?.query);
        const isLimitIncludes = JSON.stringify(vocabulary);
        if (_.includes(isLimitIncludes, "{{LIMIT}}")) {
            return queryPayload?.query
        }
        const limit = _.get(vocabulary, "limit")
        if (limit === null) {
            _.set(vocabulary, "limit.value[0].value", queryRules.common.maxResultRowLimit)
            _.set(vocabulary, "limit.value[0].type", "number")
            const convertToSQL = parser.sqlify(vocabulary);
            queryPayload.query = convertToSQL
        }
    }
}

const getDataSourceFromPayload = (queryPayload: any) => {
    if (_.isString(queryPayload.query)) {
        queryPayload?.query.replace(/from\s+["'`]?[\w-]+["'`]?(\s+where\s+)/i, ` from "${dataset_id}"$1`);
        return dataset_id
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
        logger.error({ apiId, requestBody, msgid, dataset_id, message: `Data range cannnot be more than ${allowedRange} days.`, code: errCode.invalidDateRange })
        throw { message: `Invalid date range! make sure your range cannot be more than ${allowedRange} days`, statusCode: 400, errCode: "BAD_REQUEST", code: errCode.invalidDateRange } as ErrorObject;
    }
};

const validateQueryRules = (queryPayload: any, limits: any) => {
    let fromDate: any, toDate: any;
    const allowedRange = limits.maxDateRange;
    const query = queryPayload.query;
    if (query && _.isObject(query)) {
        const dateRange = getIntervals(query);
        const extractedDateRange = Array.isArray(dateRange) ? dateRange[0].split("/") : dateRange.toString().split("/");
        fromDate = moment(extractedDateRange[0], momentFormat);
        toDate = moment(extractedDateRange[1], momentFormat);
    }
    else {
        // need to add query date validations for maximum query limit
        return true
    }
    const isValidDates = fromDate && toDate && fromDate.isValid() && toDate.isValid()
    return isValidDates ? validateDateRange(fromDate, toDate, allowedRange)
        : { message: "Invalid date range! the date range cannot be a null value", statusCode: 400, errCode: "BAD_REQUEST", code: errCode.invalidDateRange };
};

const getDataSourceRef = async (datasetId: string, granularity?: string) => {
    const dataSources = await getDatasourceList(datasetId)
    if (_.isEmpty(dataSources)) {
        logger.error({ apiId, requestBody, msgid, dataset_id, message: `Datasource ${datasetId} not available in datasource live table`, code: errCode.notFound })
        throw { message: `Datasource ${datasetId} not available for querying`, statusCode: 404, errCode: "NOT_FOUND", code: errCode.notFound } as ErrorObject;
    }
    const record = dataSources.filter((record: any) => {
        const aggregatedRecord = _.get(record, "dataValues.metadata.aggregated")
        if (granularity)
            return aggregatedRecord && _.get(record, "dataValues.metadata.granularity") === granularity;
    });
    return record[0]?.dataValues?.datasource_ref
}

const setDatasourceRef = async (datasetId: string, payload: any): Promise<any> => {
    const granularity = _.get(payload, 'context.aggregationLevel')
    const datasourceRef = await getDataSourceRef(datasetId, granularity);
    const existingDatasources = await getDatasourceListFromDruid();

    if (!_.includes(existingDatasources.data, datasourceRef)) {
        logger.error({ apiId, requestBody, msgid, dataset_id, message: `Dataset ${datasetId} with table ${granularity} is not available for querying`, code: errCode.notFound })
        throw { message: `Dataset ${datasetId} with table ${granularity} is not available for querying`, statusCode: 404, errCode: "NOT_FOUND", code: errCode.notFound } as ErrorObject;
    }
    if (_.isString(payload?.query)) {
        payload.query = payload.query.replace(datasetId, datasourceRef)
    }
    if (_.isObject(payload?.query)) {
        _.set(payload, "query.dataSource", datasourceRef);
        _.set(payload, "query.granularity", granularity);
    }
    return true;
}