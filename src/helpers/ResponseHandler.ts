import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { IResponse, Result } from "../models/DatasetModels";
import constants from "../resources/Constants.json";
import routes from "../routes/RoutesConfig";

type extendedErrorRequestHandler = ErrorRequestHandler & {
  statusCode: number;
  message: string;
  errCode: string;
  id?: string;
};

const ResponseHandler = {
  successResponse: (req: Request, res: Response, result: Result) => {
    res.status(result.status).json(ResponseHandler.refactorResponse({ id: (req as any).id, result: result.data }));
  },

  routeNotFound: (req: Request, res: Response, next: NextFunction) => {
    console.log(req.baseUrl)
    next({ statusCode: httpStatus.NOT_FOUND, message: constants.ERROR_MESSAGE.ROUTE_NOT_FOUND, errCode: httpStatus['404_NAME'] });
  },

  refactorResponse: ({ id = routes.API_ID, ver = "v2", params = { status: httpStatus[200], errmsg: "" }, responseCode = httpStatus[200], result = {} }): IResponse => {
    return <IResponse>{ id, ver, ts: Date.now(), params, responseCode, result }
  },

  errorResponse: (error: extendedErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
    const { statusCode, message, errCode } = error;
    const { id } = req as any;

    res.status(statusCode).json(ResponseHandler.refactorResponse({ id: id, params: { status: constants.STATUS.FAILURE, errmsg: message, }, responseCode: errCode || httpStatus["500_NAME"] }));
  },

  setApiId: (id: string) => (req: Request, res: Response, next: NextFunction) => {
    (req as any).id = id;
    next();
  }
}

export { ResponseHandler };
