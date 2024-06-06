import httpStatus from "http-status";
import _ from "lodash";
import moment, { Moment } from "moment";
import { queryRules } from "../configs/QueryRules";
import { IConnector, IValidator } from "../models/DatasetModels";
import { ICommonRules, ILimits, IQuery, IQueryTypeRules, IRules } from "../models/QueryModels";
import { ValidationStatus } from "../models/ValidationModels";
import constants from "../resources/Constants.json";
import { dbConnector } from "../routes/Router";
import { routesConfig } from "../configs/RoutesConfig";
import { config } from "../configs/Config";
import { isValidDateRange } from "../utils/common";
import { HTTPConnector } from "../connectors/HttpConnector";
export class QueryValidator implements IValidator {
    private limits: ILimits;
    private momentFormat: string;
    private httpConnector: any
    constructor() {
        this.limits = queryRules
        this.momentFormat = "YYYY-MM-DD HH:MI:SS"
        this.httpConnector = new HTTPConnector(`${config.query_api.druid.host}:${config.query_api.druid.port}`).connect()
    }
    public async validate(data: any, id: string): Promise<ValidationStatus> {
        let validationStatus, dataSource, shouldSkip;
        switch (id) {
            case routesConfig.query.native_query.api_id:
                validationStatus = await this.validateNativeQuery(data)
                dataSource = this.getDataSource(data)
                shouldSkip = _.includes(config.exclude_datasource_validation, dataSource);
                return validationStatus.isValid ? (shouldSkip ? validationStatus : this.setDatasourceRef(dataSource, data)) : validationStatus
            case routesConfig.query.sql_query.api_id:
                validationStatus = await this.validateSqlQuery(data)
                if (validationStatus.isValid) {
                    dataSource = this.getDataSource(data)
                    shouldSkip = _.includes(config.exclude_datasource_validation, dataSource);
                    return validationStatus.isValid ? (shouldSkip ? validationStatus : this.setDatasourceRef(dataSource, data)) : validationStatus
                }
                return validationStatus
            default:
                return <ValidationStatus>{ isValid: false }
        }
    }

    private validateNativeQuery(data: any): ValidationStatus {
        let queryObj: IQuery = data;
        this.setQueryLimits(data, this.limits.common);
        let dataSourceLimits = this.getDataSourceLimits(this.getDataSource(data));
        try {
            return (!_.isEmpty(dataSourceLimits)) ? this.validateQueryRules(queryObj, dataSourceLimits.queryRules[queryObj.query.queryType as keyof IQueryTypeRules]) : { isValid: true }
        } catch (error: any) {
            return { isValid: false, message: error.message || "error ocuured while validating native query", code: error.code || httpStatus["400_NAME"] };
        }
    }

    private validateSqlQuery(data: IQuery): ValidationStatus {
        try {
            let query = data.querySql.query;
            if (_.isEmpty(query)) {
                return { isValid: false, message: "Query must not be empty", code: httpStatus["400_NAME"] };
            }
            const fromClause = /\bFROM\b/i;
            const isFromClausePresent = fromClause.test(query)
            if (!isFromClausePresent) {
                return { isValid: false, message: "Invalid SQL Query", code: httpStatus["400_NAME"] };
            }
            const fromIndex = query.search(fromClause);
            const dataset = query.substring(fromIndex + 4).trim().split(/\s+/)[0].replace(/\\/g, "");
            if (_.isEmpty(dataset)) {
                return { isValid: false, message: "Dataset name must be present in the SQL Query", code: httpStatus["400_NAME"] };
            }
            this.setQueryLimits(data, this.limits.common);
            let datasource = this.getDataSource(data);
            let dataSourceLimits = this.getDataSourceLimits(datasource);
            return (!_.isEmpty(dataSourceLimits)) ? this.validateQueryRules(data, dataSourceLimits.queryRules.scan) : { isValid: true };
        } catch (error: any) {
            return { isValid: false, message: error.message || "error ocuured while validating SQL query", code: error.code || httpStatus["500_NAME"] };
        }
    }

    private validateQueryRules(queryPayload: IQuery, limits: IRules): ValidationStatus {
        let fromDate: Moment | undefined, toDate: Moment | undefined;
        let allowedRange = limits.maxDateRange;
        if (queryPayload.query) {
            const dateRange = this.getIntervals(queryPayload.query);
            const extractedDateRange = Array.isArray(dateRange) ? dateRange[0].split("/") : dateRange.toString().split("/");
            fromDate = moment(extractedDateRange[0], this.momentFormat);
            toDate = moment(extractedDateRange[1], this.momentFormat);
        } else {
            let query = queryPayload.querySql.query;
            query = query.toUpperCase().replace(/\s+/g, " ").trim();
            let vocabulary = query.split(/\s+/);
            let fromDateIndex = vocabulary.indexOf("TIMESTAMP");
            let toDateIndex = vocabulary.lastIndexOf("TIMESTAMP");
            fromDate = moment(vocabulary[fromDateIndex + 1], this.momentFormat);
            toDate = moment(vocabulary[toDateIndex + 1], this.momentFormat);
        }
        const isValidDates = fromDate && toDate && fromDate.isValid() && toDate.isValid()
        return isValidDates ? this.validateDateRange(fromDate, toDate, allowedRange)
            : { isValid: false, message: constants.ERROR_MESSAGE.NO_DATE_RANGE, code: httpStatus["400_NAME"] };
    };

    private getDataSource(queryPayload: IQuery): string {
        if (queryPayload.querySql) {
            let query = queryPayload.querySql.query;
            query = query.replace(/\s+/g, " ").trim();
            const fromIndex = query.search(/\bFROM\b/i);
            const dataSource = query.substring(fromIndex).split(/\s+/)[1].replace(/\\/g, "").replace(/"/g, "");
            return dataSource;
        } else {
            const dataSourceField: any = queryPayload.query.dataSource
            if (typeof dataSourceField == 'object') { return dataSourceField.name }
            return dataSourceField
        }
    };

    private getDataSourceLimits(datasource: string): any {
        for (var index = 0; index < this.limits.rules.length; index++) {
            if (this.limits.rules[index].dataset == datasource) {
                return this.limits.rules[index];
            }
        }
    };

    private validateDateRange(fromDate: moment.Moment, toDate: moment.Moment, allowedRange: number = 0): ValidationStatus {
        const isValidDates = isValidDateRange(fromDate, toDate, allowedRange);
        return isValidDates
            ? { isValid: true, code: httpStatus[200] }
            : { isValid: false, message: constants.ERROR_MESSAGE.INVALID_DATE_RANGE.replace("${allowedRange}", allowedRange.toString()), code: httpStatus["400_NAME"] };
    };

    private getLimit(queryLimit: number, maxRowLimit: number) {
        return queryLimit > maxRowLimit ? maxRowLimit : queryLimit;
    };

    private setQueryLimits(queryPayload: IQuery, limits: ICommonRules) {
        if (queryPayload.query) {
            if (queryPayload.query.threshold) {
                queryPayload.query.threshold = this.getLimit(queryPayload.query.threshold, limits.maxResultThreshold);
            } else {
                queryPayload.query.threshold = limits.maxResultThreshold;
            }
            if (queryPayload.query.limit) {
                queryPayload.query.limit = this.getLimit(queryPayload.query.limit, limits.maxResultRowLimit);
            } else {
                queryPayload.query.limit = limits.maxResultRowLimit;
            }
        } else {
            const limitClause = /\bLIMIT\b/i;
            const vocabulary = queryPayload.querySql.query.split(/\s+/); // Splitting the query by whitespace
            const queryLimitIndex = vocabulary.findIndex(word => limitClause.test(word));
            const queryLimit = Number(vocabulary[queryLimitIndex + 1]);

            if (isNaN(queryLimit)) {
                // If "LIMIT" clause doesn't exist or its value is not a number, update the query
                const updatedVocabulary = [...vocabulary, "LIMIT", limits.maxResultRowLimit];
                queryPayload.querySql.query = updatedVocabulary.join(" ");
            } else {
                // If "LIMIT" clause exists and its value is a number, update the limit
                const newLimit = this.getLimit(queryLimit, limits.maxResultRowLimit);
                vocabulary[queryLimitIndex + 1] = newLimit.toString();
                queryPayload.querySql.query = vocabulary.join(" ");
            }
        }
    }
    public async validateDatasource(datasource: any) {
        let existingDatasources = await this.httpConnector(config.query_api.druid.list_datasources_path, {})
        if (!_.includes(existingDatasources.data, datasource)) {
            let error = constants.INVALID_DATASOURCE
            error.message = error.message.replace('${datasource}', datasource)
            throw error
        }
        return
    }
    public async setDatasourceRef(dataSource: string, payload: any): Promise<ValidationStatus> {
        try {
            const granularity = _.get(payload, 'context.granularity')
            const dataSourceType = _.get(payload, 'context.dataSourceType', config.query_api.druid.queryType)
            let dataSourceRef = await this.getDataSourceRef(dataSource, granularity, dataSourceType);
            if (dataSourceType === config.query_api.druid.queryType) await this.validateDatasource(dataSourceRef)
            if (payload?.querySql && dataSourceType === config.query_api.druid.queryType) {
                payload.querySql.query = payload.querySql.query.replace(dataSource, dataSourceRef)
            }
            else if (payload?.querySql && dataSourceType === config.query_api.lakehouse.queryType) {
                // hudi tables doesn't support table names contain '-' so we need to replace it with '_'
                let modifiedDataSource = dataSourceRef.replace(/-/g, "_")
                payload.querySql.query = payload.querySql.query.replace(dataSource, modifiedDataSource).replace(/"/g, "")
            }
            else {
                payload.query.dataSource = dataSourceRef
            }
            return { isValid: true };
        } catch (error: any) {
            return { isValid: false, message: error.message || "error ocuured while fetching datasource record", code: error.code || httpStatus["400_NAME"] };
        }
    }

    public async getDataSourceRef(datasource: string, granularity: string | undefined, dataSourceType: string): Promise<string> {
        let storageType = dataSourceType === config.query_api.lakehouse.queryType ? config.datasource_storage_types.datalake : config.datasource_storage_types.druid
        const records: any = await dbConnector.readRecords("datasources", { "filters": { "dataset_id": datasource, "type": storageType } })
        if (records.length == 0) {
            const error = { ...constants.INVALID_DATASOURCE }
            error.message = error.message.replace('${datasource}', datasource)
            throw error
        }
        if (storageType === config.datasource_storage_types.datalake) return `${config.query_api.lakehouse.catalog}.${config.query_api.lakehouse.schema}.${records[0].datasource_ref}_ro`
        const record = records.filter((record: any) => {
            const aggregatedRecord = _.get(record, "metadata.aggregated")
            if (granularity)
                return aggregatedRecord && _.get(record, "metadata.granularity") === granularity;
            else
                return !aggregatedRecord
        });

        if (record.length == 0) {
            const error = { ...constants.INVALID_DATASOURCE }
            error.message = error.message.replace('${datasource}', datasource)
            if (granularity !== undefined) {
                error.message = `Aggregate ${error.message}`
            }
            throw error
        }
        return record[0].datasource_ref
    }

    private getIntervals(payload: any) {
        return (typeof payload.intervals == 'object' && !Array.isArray(payload.intervals)) ? payload.intervals.intervals : payload.intervals
    }
}
