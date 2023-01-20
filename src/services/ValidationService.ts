import Ajv from "ajv";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import errorResponse from "http-errors";
import httpStatus from "http-status";
import { isUndefined } from "lodash";
import moment, { Moment } from "moment";
import { ICommonRules, ILimits, IQuery, IQueryTypeRules, IRules } from "../models/QueryModels";
import constants from "../resources/constants.json";
const schemaValidator = new Ajv();

export class ValidationService {
  private requestBodySchema: Object;
  private nativeQuerySchema: Object;
  private limits: ILimits;

  constructor(configDir: string) {
    this.requestBodySchema = JSON.parse(fs.readFileSync(process.cwd() + `${configDir}schemas/` + "queryRequest.json", "utf8"));
    this.nativeQuerySchema = JSON.parse(fs.readFileSync(process.cwd() + `${configDir}schemas/` + "nativeQuery.json", "utf8"));
    this.limits = JSON.parse(fs.readFileSync(process.cwd() + configDir + "limits.json", "utf8"));
  }

  public validateRequestBody = (req: Request, res: Response, next: NextFunction) => {
    const queryPayload = req.body;
    let validRequestObj = schemaValidator.validate(this.requestBodySchema, queryPayload);
    if (!validRequestObj) {
      let error = schemaValidator.errors;
      let errorMessage = error![0].instancePath.replace("/", "") + " " + error![0].message;
      throw errorResponse(httpStatus.BAD_REQUEST, errorMessage, { errCode: httpStatus["400_NAME"] });
    }
    next();
  };

  public validateConfiguration = (req: Request, res: Response, next: NextFunction) => {
    let dataSource: string = this.getDataSource(req.body);
    let dataSourceLimits = this.getDataSourceLimits(dataSource);
    if (dataSource != req.body.context.dataSource || isUndefined(dataSourceLimits)) {
      console.warn(`Rules not found : ${dataSource}`)
      next();
    }
    next();
  };

  public validateNativeQuery = (req: Request, res: Response, next: NextFunction) => {
    let isValidQuery = schemaValidator.validate(this.nativeQuerySchema, req.body.query);
    if (isValidQuery) {
      let queryObj: IQuery = req.body;
      this.setQueryLimits(req.body, this.limits.common);
      let dataSourceLimits = this.getDataSourceLimits(queryObj.query.dataSource);
      try {
        this.validateQueryRules(queryObj, dataSourceLimits.queryRules[queryObj.query.queryType as keyof IQueryTypeRules]);
      } catch (error: any) {
        next(errorResponse(httpStatus.BAD_REQUEST, error.message, { errCode: httpStatus["400_NAME"] }));
      }
    } else {
      let error = schemaValidator.errors;
      let errorMessage = error![0].instancePath.replace("/", "") + " " + error![0].message;
      next(errorResponse(httpStatus.BAD_REQUEST, errorMessage, { errCode: httpStatus["400_NAME"] }));
    }
    next();
  };

  public validateSqlQuery = (req: Request, res: Response, next: NextFunction) => {
    this.setQueryLimits(req.body, this.limits.common);
    let dataSourceLimits = this.getDataSourceLimits(this.getDataSource(req.body));
    try {
      this.validateQueryRules(req.body, dataSourceLimits.queryRules.scan);
    } catch (error: any) {
      next(errorResponse(httpStatus.BAD_REQUEST, error.message, { errCode: httpStatus["400_NAME"] }));
    }
    next();
  };

  private validateQueryRules = (queryPayload: IQuery, limits: IRules) => {
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
    if (fromDate && toDate && fromDate.isValid() && toDate.isValid()) {
      return this.validateDateRange(fromDate, toDate, allowedRange);
    } else {
      throw new Error(constants.ERROR_MESSAGE.NO_DATE_RANGE);
    }
  };

  private setQueryLimits = (queryPayload: IQuery, limits: ICommonRules) => {
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
  };

  private getDataSource = (queryPayload: IQuery): string => {
    if (queryPayload.querySql) {
      let query = queryPayload.querySql.query;
      query = query.replace(/\s+/g, " ").trim();
      let dataSource = query.substring(query.indexOf("FROM")).split(" ")[1];
      return dataSource.replace(/"/g, "");
    } else {
      return queryPayload.query.dataSource;
    }
  };

  private getDataSourceLimits = (datasource: string): any => {
    for (var index = 0; index < this.limits.rules.length; index++) {
      if (this.limits.rules[index].dataSource == datasource) {
        return this.limits.rules[index];
      }
    }
  };

  private validateDateRange = (fromDate: moment.Moment, toDate: moment.Moment, allowedRange: number = 0) => {
    const differenceInDays = Math.abs(fromDate.diff(toDate, "days"));
    if (differenceInDays > allowedRange) {
      throw new Error(constants.ERROR_MESSAGE.INVALID_DATE_RANGE.replace("${allowedRange}", allowedRange.toString()));
    }
  };

  private getLimit = (queryLimit: number, maxRowLimit: number) => {
    return queryLimit > maxRowLimit ? maxRowLimit : queryLimit;
  };
}
