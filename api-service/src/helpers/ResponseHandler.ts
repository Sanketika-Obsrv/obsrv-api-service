import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { IResponse, Result } from "../types/DatasetModels";
import { onFailure, onSuccess } from "../metrics/prometheus/helpers";
import moment from "moment";
import { v4 as uuidv4 } from 'uuid';
import _ from "lodash";

const ResponseHandler = {
  successResponse: (req: Request, res: Response, result: Result) => {
    const { entity, body } = req as any;
    entity && onSuccess(req)
    const msgid = _.get(body, ["params", "mid"])
    res.status(result.status || 200).json(ResponseHandler.refactorResponse({ id: (req as any).id, result: result.data, mid: msgid }));
  },

  routeNotFound: (req: Request, res: Response, next: NextFunction) => {
    next({ statusCode: httpStatus.NOT_FOUND, message: httpStatus["404"], errCode: httpStatus["404_NAME"] });
  },

  refactorResponse: ({ id = "api", ver = "v1", params = { status: "SUCCESS", err: "0", errmsg: "" }, responseCode = httpStatus["200_NAME"], result = {}, mid = "" }): IResponse => {
    const paramsObj = { ...params, ...(!_.isEmpty(mid) && { mid }), resmsgid: uuidv4().toString() }
    const updatedParams = _.isEmpty(paramsObj.errmsg) ? _.omit(paramsObj, ["errmsg"]) : paramsObj
    return <IResponse>{ id, ver, ts: moment().format(), params: updatedParams, responseCode, result }
  },

  errorResponse: (error: Record<string, any>, req: Request, res: Response) => {
    const { statusCode, message, errCode } = error;
    const { id, entity, body } = req as any;
    const msgid = _.get(body, ["params", "mid"])
    entity && onFailure(req)
    res.status(statusCode || httpStatus.INTERNAL_SERVER_ERROR).json(ResponseHandler.refactorResponse({ id: id, mid: msgid, params: { status: "FAILED", errmsg: message, err: "1" }, responseCode: errCode || httpStatus["500_NAME"] }));
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
