import { AxiosInstance } from "axios";
import { NextFunction, Request, Response } from "express";
import _ from "lodash";
import { config } from "../configs/Config";
import { ResponseHandler } from "../helpers/ResponseHandler";
import { IConnector } from "../models/DatasetModels";
import { ErrorResponseHandler } from "../helpers/ErrorResponseHandler";

export class QueryService {
  private connector: AxiosInstance;
  private errorHandler: ErrorResponseHandler;
  constructor(connector: IConnector) {
    this.connector = connector.connect();
    this.errorHandler = new ErrorResponseHandler("QueryService");
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
      ResponseHandler.successResponse(req, res, { status: result.status, data: _.flatten(mergedResult) });

    } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false); }
  };

  public executeSqlQuery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.connector.post(config.query_api.druid.sql_query_path, req.body.querySql);
      ResponseHandler.successResponse(req, res, { status: result.status, data: result.data });
    } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false); }
  }
}
