import { NextFunction, Request, Response } from "express";
import errorResponse from "http-errors";
import httpStatus from "http-status";
import _ from "lodash";
import { config } from "../configs/config";
import { HTTPConnector } from "../connectors/HttpConnector";
import { ResponseHandler } from "../helpers/responseHandler";
 
const responseHandler = new ResponseHandler();
const httpConnector = new HTTPConnector(`${config.query_api.druid.host}:${config.query_api.druid.port}`).connect()

export class QueryService {
  public getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await httpConnector.get(config.query_api.druid.status_api);
      responseHandler.successResponse(req, res, { status: result.status, data: result.data });
    } catch (error: any) {
      next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message));
    }
  };

  public getHealthStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await httpConnector.get(config.query_api.druid.health_api);
      responseHandler.successResponse(req, res, { status: result.status, data: result.data });
    } catch (error: any) {
      next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message));
    }
  };

  public executeNativeQuery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      var result = await httpConnector.post(config.query_api.druid.native_query_path, req.body.query);
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
      const result = await httpConnector.post(config.query_api.druid.sql_query_path, req.body.querySql);
      responseHandler.successResponse(req, res, { status: result.status, data: result.data });
    } catch (error: any) {
      next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message));
    }
  };

}

