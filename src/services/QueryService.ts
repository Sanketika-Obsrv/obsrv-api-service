import { AxiosInstance } from "axios";
import { NextFunction, Request, Response } from "express";
import errorResponse from "http-errors";
import httpStatus from "http-status";
import _ from "lodash";
import { config } from "../configs/config";
import { ResponseHandler } from "../helpers/responseHandler";
import { IConnector } from "../models/DatasetModels";
const responseHandler = ResponseHandler
 
export class QueryService {
  private connector: AxiosInstance;
  constructor(connector: IConnector) {
    this.connector = connector.connect();;
  }
  public executeNativeQuery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      var result = await this.connector.post(config.query_api.druid.native_query_path, req.body.query);
      var mergedResult = result.data;
      if (req.body.query.queryType === "scan" && result.data) {
        mergedResult = result.data.map((item: Record<string, any>) => {
          return item.events;
        });
      }
      responseHandler.successResponse(req, res, { status: result.status, data: _.flatten(mergedResult) });
    } catch (error: any) {
      next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message));
    }
  };

  public executeSqlQuery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.connector.post(config.query_api.druid.sql_query_path, req.body.querySql);
      responseHandler.successResponse(req, res, { status: result.status, data: result.data });
    } catch (error: any) {
      next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message));
    }
  };

}

