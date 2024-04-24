import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { IResponse, Result } from "../types/DatasetModels";
import { onFailure, onSuccess } from "../metrics/prometheus/helpers";
import moment from "moment";
import { v4 as uuidv4 } from 'uuid';
import _ from "lodash";

const ResponseHandler = {
  successResponse: (req: Request, res: Response, result: Result) => {
    const { body, entity } = req as any;
    const msgid = _.get(body, ["params", "msgid"])
    res.status(result.status || 200).json(ResponseHandler.refactorResponse({ id: (req as any).id, result: result.data, msgid }));
    entity && onSuccess(req, res)
  },

  routeNotFound: (req: Request, res: Response, next: NextFunction) => {
    next({ statusCode: httpStatus.NOT_FOUND, message: httpStatus["404"], errCode: httpStatus["404_NAME"] });
  },

  refactorResponse: ({ id = "api", ver = "v1", params = { status: "SUCCESS" }, responseCode = httpStatus["200_NAME"], result = {}, msgid = "" }): IResponse => {
    const paramsObj = { ...params, ...(!_.isEmpty(msgid) && { msgid }), resmsgid: uuidv4() }
    return <IResponse>{ id, ver, ts: moment().format(), params: paramsObj, responseCode, result }
  },

  errorResponse: (error: Record<string, any>, req: Request, res: Response) => {
    const { statusCode, message, errCode, code = "INTERNAL_SERVER_ERROR", trace = "" } = error;
    const { id, entity, body } = req as any;
    const msgid = _.get(body, ["params", "msgid"])
    const response = ResponseHandler.refactorResponse({ id, msgid, params: { status: "FAILED" }, responseCode: errCode || httpStatus["500_NAME"] })
    res.status(statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({ ...response, error: { code, message, trace } });
    entity && onFailure(req, res)
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
