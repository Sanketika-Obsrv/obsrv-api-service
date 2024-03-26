import { IQueryTypeRules } from "../../types/QueryModels";
import { queryRules } from "./QueryRules";
import * as _ from "lodash";
import moment from "moment";
import { config } from "../../configs/Config";
import { getDatasourceList } from "../../services/DatasourceService";
import axios from "axios";
import logger from "../../logger";

const momentFormat = "YYYY-MM-DD HH:MI:SS";

export const validateQuery = async (requestPayload: any) => {
    const query = requestPayload?.query;
    const isValid = (_.isObject(query)) ? validateNativeQuery(requestPayload) : (_.isString(query)) ? validateSqlQuery(requestPayload) : false;
    const datasource = getDataSourceFromPayload(requestPayload);
    const shouldSkipValidation = _.includes(config.exclude_datasource_validation, datasource);

    if (!shouldSkipValidation) {
        return setDatasourceRef(datasource, requestPayload);
    }

    return isValid;
}

const validateNativeQuery = (data: any) => {
    setQueryLimits(data)
    let dataSourceLimits: any = getDataSourceLimits(getDataSourceFromPayload(data));
    if (!_.isEmpty(dataSourceLimits) && dataSourceLimits !== undefined) {
        const isValidDate = validateQueryRules(data, dataSourceLimits.queryRules[data.query.queryType as keyof IQueryTypeRules])
        return isValidDate
    }
    else {
        return true;
    }
}

const validateSqlQuery = (data: any) => {
    setQueryLimits(data);
    let dataSourceLimits: any = getDataSourceLimits(getDataSourceFromPayload(data));
    if (!_.isEmpty(dataSourceLimits) && dataSourceLimits !== undefined) {
        const isValidDate = validateQueryRules(data, dataSourceLimits.queryRules.scan)
        return isValidDate
    }
    else {
        return true;
    }
}

const getLimit = (queryLimit: number, maxRowLimit: number) => {
    return queryLimit > maxRowLimit ? maxRowLimit : queryLimit;
};

const setQueryLimits = (queryPayload: any) => {
    if (_.isObject(queryPayload?.query)) {
        const threshold = _.get(queryPayload, "query.threshold")
        if (threshold !== undefined) {
            const maxThreshold = getLimit(threshold, queryRules.common.maxResultThreshold)
            _.set(queryPayload, "query.threshold", maxThreshold)
        }

        const scanLimit = _.get(queryPayload, "query.limit");
        if (scanLimit !== undefined) {
            const maxSacnLimit = getLimit(scanLimit, queryRules.common.maxResultRowLimit)
            _.set(queryPayload, "query.limit", maxSacnLimit)
        }
    }

    if (_.isString(queryPayload?.query)) {
        let vocabulary = queryPayload?.query.split(" ");
        let queryLimitIndex = vocabulary.indexOf("LIMIT");
        let queryLimit = Number(vocabulary[queryLimitIndex + 1]);
        if (isNaN(queryLimit)) {
            const updatedVocabulary = [...vocabulary, "LIMIT", queryRules.common.maxResultRowLimit].join(" ");
            queryPayload.query = updatedVocabulary;
        } else {
            let newLimit = getLimit(queryLimit, queryRules.common.maxResultRowLimit);
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
        return "";
    }
    if (_.isObject(queryPayload.query)) {
        const dataSourceField: any = queryPayload.query?.dataSource;
        if (typeof dataSourceField === 'object') { return dataSourceField.name || "" }
        return dataSourceField || "";
    }
}

const getDataSourceLimits = (datasource: string) => {
    const rules = _.get(queryRules, "rules") || [];
    for (var index = 0; index < rules.length; index++) {
        if (rules[index].dataset == datasource) {
            return rules[index];
        }
    }
};

const getIntervals = (payload: any) => {
    return (typeof payload.intervals == 'object' && !Array.isArray(payload.intervals)) ? payload.intervals.intervals : payload.intervals
}

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
    let allowedRange = limits.maxDateRange;
    if (queryPayload.query && _.isObject(queryPayload.query)) {
        const dateRange = getIntervals(queryPayload.query);
        const extractedDateRange = Array.isArray(dateRange) ? dateRange[0].split("/") : dateRange.toString().split("/");
        fromDate = moment(extractedDateRange[0], momentFormat);
        toDate = moment(extractedDateRange[1], momentFormat);
    }
    else {
        let vocabulary = queryPayload.query.split(" ");
        let fromDateIndex = vocabulary.indexOf("TIMESTAMP");
        let toDateIndex = vocabulary.lastIndexOf("TIMESTAMP");
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
        return { message: `Datasource ${datasourceName} not available for querying`, statusCode: 404, errCode: "NOT_FOUND" };
    }
    const record = dataSources.filter((record: any) => {
        const aggregatedRecord = _.get(record, "metadata.aggregated")
        if (granularity)
            return aggregatedRecord && _.get(record, "metadata.granularity") === granularity;
        else
            return !aggregatedRecord
    });
    return record[0]?.dataValues?.datasource_ref
}

const validateDatasource = async (datasource: any) => {
    let existingDatasources = await axios.get(`${config?.query_api?.druid?.host}:${config?.query_api?.druid?.port}${config.query_api.druid.list_datasources_path}`, {})
    if (!_.includes(existingDatasources.data, datasource)) {
        return false
    }
    return true
}

const setDatasourceRef = async (dataSourceName: string, payload: any): Promise<any> => {
    try {
        const granularity = _.get(payload, 'context.granularity')
        let datasourceRef = await getDataSourceRef(dataSourceName, granularity);
        if (_.isObject(datasourceRef)) {
            logger.error(`Datasource ${dataSourceName} not present in the datasources live table.`)
            return datasourceRef
        }
        const isDatasourcePresentInDruid = await validateDatasource(datasourceRef);
        if (isDatasourcePresentInDruid === false) {
            logger.error(`Datasource ${dataSourceName} not available for querying in druid.`)
            return { message: `Datasource ${dataSourceName} not available for querying`, statusCode: 404, errCode: "NOT_FOUND" };
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
