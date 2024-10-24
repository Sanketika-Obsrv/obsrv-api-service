import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { IResponse, Result } from "../types/DatasetModels";
import { onFailure, onObsrvFailure, onSuccess } from "../metrics/prometheus/helpers";
import moment from "moment";
import _ from "lodash";
import { ObsrvError } from "../types/ObsrvError";
import logger from "../logger";

const ResponseHandler = {
  successResponse: (req: Request, res: Response, result: Result) => {
    const { body, entity } = req as any;
    const msgid = _.get(body, ["params", "msgid"])
    const resmsgid = _.get(res, "resmsgid")
    res.status(result.status || 200).json(ResponseHandler.refactorResponse({ id: (req as any).id, result: result.data, msgid, resmsgid }));
    entity && onSuccess(req, res)
  },

  routeNotFound: (req: Request, res: Response) => {
    ResponseHandler.obsrvErrorResponse({ statusCode: httpStatus.NOT_FOUND, message: "Route not found", errCode: httpStatus["404_NAME"], code: "ROUTE_NOT_FOUND", err: undefined, data: "", datasetId: "" }, req, res)
  },

  refactorResponse: ({ id = "api", ver = "v2", params = { status: "SUCCESS" }, responseCode = httpStatus["200_NAME"], result = {}, msgid = "", resmsgid = "" }): IResponse => {
    const paramsObj = { ...params, ...(!_.isEmpty(msgid) && { msgid }), resmsgid }
    return <IResponse>{ id, ver, ts: moment().format(), params: paramsObj, responseCode, result }
  },

  errorResponse: (error: Record<string, any>, req: Request, res: Response) => {
    const { statusCode, message, errCode, code = "INTERNAL_SERVER_ERROR", trace = "" } = error;
    const sanitizedError = { ...error, proxyAuthKey: "REDACTED" };
    logger.error(sanitizedError)
    const { id, entity, body } = req as any;
    const msgid = _.get(body, ["params", "msgid"])
    const resmsgid = _.get(res, "resmsgid")
    const response = ResponseHandler.refactorResponse({ id, msgid, params: { status: "FAILED" }, responseCode: errCode || httpStatus["500_NAME"], resmsgid })
    const modifiedErrorResponse = _.omit(response, ["result"]);
    res.status(statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({ ...modifiedErrorResponse, error: { code, message, trace } });
    entity && onFailure(req, res)
  },

  obsrvErrorResponse: (error: ObsrvError, req: Request, res: Response) => {
    const { statusCode, message, errCode, code = "INTERNAL_SERVER_ERROR", data } = error;
    const sanitizedError = { ...error, proxyAuthKey: "REDACTED" };
    logger.error(sanitizedError)
    const { id, entity, body } = req as any;
    const msgid = _.get(body, ["params", "msgid"])
    const resmsgid = _.get(res, "resmsgid")
    const response = ResponseHandler.refactorResponse({ id, msgid, params: { status: "FAILED" }, responseCode: errCode || httpStatus["500_NAME"], resmsgid, result: data })
    res.status(statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({ ...response, error: { code, message } });
    entity && onObsrvFailure(req, res, error)
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

  goneResponse: (req: Request, res: Response) => {
    const { id } = req as any;
    res.status(httpStatus.GONE).json({ id: id, ver: "v1", ts: Date.now(), params: { status: "FAILED", errmsg: "v1 APIs have been replace by /v2 APIs. Please refer to this link <addLink> for more information" }, responseCode: httpStatus["410_NAME"] })
  }
}

export { ResponseHandler };
