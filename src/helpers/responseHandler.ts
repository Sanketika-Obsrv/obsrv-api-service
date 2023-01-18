import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { IResponse } from "../models/QueryModels";
import constants from "../resources/constants.json";
import routes from "../routes/routesConfig";

type extendedErrorRequestHandler = ErrorRequestHandler & {
  statusCode: number;
  message: string;
  errCode: string;
  id?: string;
};

class ResponseHandler {
  public successResponse(req: Request, res: Response, result: IResponse) {
    const responseHandler = new ResponseHandler();
    res.status(result.status).json(responseHandler.refactorResponse({ id: (req as any).id, result: result.data }));
  }

  public routeNotFound = (req: Request, res: Response, next: NextFunction) => {
    next({ statusCode: httpStatus.NOT_FOUND, message: constants.ERROR_MESSAGE.ROUTE_NOT_FOUND, errCode: httpStatus['404_NAME'] });
  };

  public refactorResponse({ id = routes.API_ID, ver = "v2", params = { status: constants.STATUS.SUCCESS, errmsg: "" }, responseCode = httpStatus[200], result = {} }): object {
    return {
      id,
      ver,
      ts: Date.now(),
      params,
      responseCode,
      result
    };
  }

  public errorResponse(error: extendedErrorRequestHandler, req: Request, res: Response, next: NextFunction) {
    const responseHandler = new ResponseHandler();
    const { statusCode, message, errCode } = error;
    const { id } = req as any;
    res.status(statusCode).json(responseHandler.refactorResponse({ id: id, params: { status: constants.STATUS.FAILURE, errmsg: message, }, responseCode: errCode || httpStatus["500_NAME"] }));
  }

  public setApiId = (id: string) => (req: Request, res: Response, next: NextFunction) => {
    (req as any).id = id;
    next();
  };
}

export { ResponseHandler };
