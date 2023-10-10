import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { IResponse, Result } from "../models/DatasetModels";
import constants from "../resources/Constants.json";
import { routesConfig } from "../configs/RoutesConfig";
import { onFailure, onSuccess } from "./prometheus/helpers";
type extendedErrorRequestHandler = ErrorRequestHandler & {
  statusCode: number;
  message: string;
  errCode: string;
  id?: string;
};

const ResponseHandler = {
  successResponse: (req: Request, res: Response, result: Result) => {
    const { entity } = req as any;
    entity && onSuccess(req, res)
    res.status(result.status || 200).json(ResponseHandler.refactorResponse({ id: (req as any).id, result: result.data }));
  },

  routeNotFound: (req: Request, res: Response, next: NextFunction) => {
    next({ statusCode: httpStatus.NOT_FOUND, message: constants.ERROR_MESSAGE.ROUTE_NOT_FOUND, errCode: httpStatus["404_NAME"] });
  },

  refactorResponse: ({ id = routesConfig.default.api_id, ver = "v1", params = { status: constants.STATUS.SUCCESS, errmsg: "" }, responseCode = httpStatus["200_NAME"], result = {} }): IResponse => {
    return <IResponse>{ id, ver, ts: Date.now(), params, responseCode, result }
  },

  errorResponse: (error: extendedErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
    const { statusCode, message, errCode } = error;
    const { id, entity } = req as any;
    entity && onFailure(req, res)
    res.status(statusCode || httpStatus.INTERNAL_SERVER_ERROR).json(ResponseHandler.refactorResponse({ id: id, params: { status: constants.STATUS.FAILURE, errmsg: message, }, responseCode: errCode || httpStatus["500_NAME"] }));
  },

  setApiId: (id: string) => (req: Request, res: Response, next: NextFunction) => {
    (req as any).id = id;
    next();
  },

  flatResponse: (req: Request, res: Response, result: Result) => {
    const { entity } = req as any;
    entity && onSuccess(req, res)
    res.status(result.status).send(result.data);
  },
}

export { ResponseHandler };
