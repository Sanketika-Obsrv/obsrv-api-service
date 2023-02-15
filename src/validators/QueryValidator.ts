import httpStatus from "http-status";
import _, { isEmpty } from "lodash";
import moment, { Moment } from "moment";
import { queryRules } from "../configs/QueryRules";
import { IValidator } from "../models/DatasetModels";
import { ICommonRules, ILimits, IQuery, IQueryTypeRules, IRules } from "../models/QueryModels";
import { ValidationStatus } from "../models/ValidationModels";
import constants from "../resources/Constants.json";
import routes from "../routes/RoutesConfig";
export class QueryValidator implements IValidator {
    private limits: ILimits;
    constructor() {
        this.limits = queryRules
    }
    validate(data: any, id: string): ValidationStatus {
        switch (id) {
            case routes.QUERY.NATIVE_QUERY.API_ID:
                return this.validateNativeQuery(data)
            case routes.QUERY.SQL_QUERY.API_ID:
                return this.validateSqlQuery(data)
            default:
                return <ValidationStatus>{ isValid: false }
        }
    }

    private validateNativeQuery(data: any): ValidationStatus {
        const validation = this.validateConfiguration(data)
        if (!validation.isValid) return validation
        let queryObj: IQuery = data;
        this.setQueryLimits(data, this.limits.common);
        let dataSourceLimits = this.getDataSourceLimits(queryObj.query.dataSource);
        return this.validateQueryRules(queryObj, dataSourceLimits.queryRules[queryObj.query.queryType as keyof IQueryTypeRules]);
    }

    private validateSqlQuery(data: any): ValidationStatus {
        const validation = this.validateConfiguration(data)
        if (!validation.isValid) return validation
        this.setQueryLimits(data, this.limits.common);
        let dataSourceLimits = this.getDataSourceLimits(this.getDataSource(data));
        return this.validateQueryRules(data, dataSourceLimits.queryRules.scan);
    }

    private validateQueryRules(queryPayload: IQuery, limits: IRules): ValidationStatus {
        let fromDate: Moment | undefined, toDate: Moment | undefined;
        let allowedRange = limits.maxDateRange;
        if (queryPayload.query) {
            const dateRange = queryPayload.query.intervals;
            const extractedDateRange = Array.isArray(dateRange) ? dateRange[0].split("/") : dateRange.toString().split("/");
            fromDate = moment(extractedDateRange[0], "YYYY-MM-DD HH:MI:SS");
            toDate = moment(extractedDateRange[1], "YYYY-MM-DD HH:MI:SS");
        } else {
            let vocabulary = queryPayload.querySql.query.split(" ");
            let fromDateIndex = vocabulary.indexOf("TIMESTAMP");
            let toDateIndex = vocabulary.lastIndexOf("TIMESTAMP");
            fromDate = moment(vocabulary[fromDateIndex + 1], "YYYY-MM-DD HH:MI:SS");
            toDate = moment(vocabulary[toDateIndex + 1], "YYYY-MM-DD HH:MI:SS");
        }
        const isValidDates = fromDate && toDate && fromDate.isValid() && toDate.isValid()
        return isValidDates ? this.validateDateRange(fromDate, toDate, allowedRange)
            : { isValid: false, message: constants.ERROR_MESSAGE.NO_DATE_RANGE, code: httpStatus[400] };
    };



    private getDataSource(queryPayload: IQuery): string {
        if (queryPayload.querySql) {
            let query = queryPayload.querySql.query;
            query = query.replace(/\s+/g, " ").trim();
            let dataSource = query.substring(query.indexOf("FROM")).split(" ")[1];
            return dataSource.replace(/"/g, "");
        } else {
            return queryPayload.query.dataSource;
        }
    };

    private getDataSourceLimits(datasource: string): any {
        for (var index = 0; index < this.limits.rules.length; index++) {
            if (this.limits.rules[index].dataSource == datasource) {
                return this.limits.rules[index];
            }
        }
    };

    private validateDateRange(fromDate: moment.Moment, toDate: moment.Moment, allowedRange: number = 0): ValidationStatus {
        const differenceInDays = Math.abs(fromDate.diff(toDate, "days"));
        const isValidDates = (differenceInDays > allowedRange) ? false : true
        return isValidDates
            ? { isValid: true, code: httpStatus[200] }
            : { isValid: false, message: constants.ERROR_MESSAGE.INVALID_DATE_RANGE.replace("${allowedRange}", allowedRange.toString()), code: httpStatus[400] };
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

    public validateConfiguration = (data: any): ValidationStatus => {
        let dataSource: string = this.getDataSource(data);
        let dataSourceLimits = this.getDataSourceLimits(dataSource);
        const rules = (dataSource != data.context.dataSource) || (_.isUndefined(dataSourceLimits))
        return rules ?
            { isValid: false, message: "Data source Rules Not found", code: httpStatus[404] }
            : { isValid: true }
    };

}