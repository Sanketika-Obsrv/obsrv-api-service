import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { IResponse, Result } from "../types/DatasetModels";
import { onFailure, onSuccess } from "../metrics/prometheus/helpers";

const ResponseHandler = {
  successResponse: (req: Request, res: Response, result: Result) => {
    const { entity } = req as any;
    entity && onSuccess(req)
    res.status(result.status || 200).json(ResponseHandler.refactorResponse({ id: (req as any).id, result: result.data }));
  },

  routeNotFound: (req: Request, res: Response, next: NextFunction) => {
    next({ statusCode: httpStatus.NOT_FOUND, message: httpStatus["404"], errCode: httpStatus["404_NAME"] });
  },

  refactorResponse: ({ id = "api", ver = "v1", params = { status: httpStatus["200_NAME"], errmsg: "" }, responseCode = httpStatus["200_NAME"], result = {} }): IResponse => {
    return <IResponse>{ id, ver, ts: Date.now(), params, responseCode, result }
  },

  errorResponse: (error: Record<string, any>, req: Request, res: Response) => {
    const { statusCode, message, errCode } = error;
    const { id, entity } = req as any;
    entity && onFailure(req)
    res.status(statusCode || httpStatus.INTERNAL_SERVER_ERROR).json(ResponseHandler.refactorResponse({ id: id, params: { status: httpStatus["500"], errmsg: message, }, responseCode: errCode || httpStatus["500_NAME"] }));
  },

  setApiId: (id: string) => (req: Request, res: Response, next: NextFunction) => {
    (req as any).id = id;
    next();
  },

  flatResponse: (req: Request, res: Response, result: Result) => {
    const { entity } = req as any;
    entity && onSuccess(req)
    res.status(result.status).send(result.data);
  },
}

export { ResponseHandler };
