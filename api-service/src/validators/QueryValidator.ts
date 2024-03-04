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
            const dataset = query.substring(query.indexOf("FROM")).split(" ")[1].replace(/\\/g, "");
            if (_.isEmpty(dataset)) {
                return { isValid: false, message: "Dataset name must be present in the SQL Query", code: httpStatus["400_NAME"] };
            }
            this.setQueryLimits(data, this.limits.common);
            let datasource = this.getDataSource(data);
            let dataSourceLimits = this.getDataSourceLimits(datasource);
            return (!_.isEmpty(dataSourceLimits)) ? this.validateQueryRules(data, dataSourceLimits.queryRules.scan) : { isValid: true };
        } catch (error: any) {
            return { isValid: false, message: error.message || "error ocuured while validating SQL query", code: error.code || httpStatus[ "500_NAME" ] };
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
            let vocabulary = queryPayload.querySql.query.split(" ");
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
            let dataSource = query.substring(query.indexOf("FROM")).split(" ")[1].replace(/\\/g, "");
            return dataSource.replace(/"/g, "");
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
            let vocabulary = queryPayload.querySql.query.split(" ");
            let queryLimitIndex = vocabulary.indexOf("LIMIT");
            let queryLimit = Number(vocabulary[queryLimitIndex + 1]);
            if (isNaN(queryLimit)) {
                const updatedVocabulary = [...vocabulary, "LIMIT", limits.maxResultRowLimit].join(" ");
                queryPayload.querySql.query = updatedVocabulary;
            } else {
                let newLimit = this.getLimit(queryLimit, limits.maxResultRowLimit);
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
            let dataSourceRef = await this.getDataSourceRef(dataSource, granularity);
            await this.validateDatasource(dataSourceRef)
            if (payload.querySql) {
                payload.querySql.query = payload.querySql.query.replace(dataSource, dataSourceRef)
            }
            else {
                payload.query.dataSource = dataSourceRef
            }
            return { isValid: true };
        } catch (error: any) {
            console.log(error?.message)
            return { isValid: false, message: error.message || "error ocuured while fetching datasource record", code: error.code || httpStatus[ "400_NAME" ] };
        }
    }

    public async getDataSourceRef(datasource: string, granularity: string | undefined): Promise<string> {
        const records: any = await dbConnector.readRecords("datasources", { "filters": { "dataset_id": datasource } })
        const record = records.filter((record: any) => {
            const aggregatedRecord = _.get(record, "metadata.aggregated")
            if(granularity)
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
