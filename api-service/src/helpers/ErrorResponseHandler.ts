import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { setAuditState } from "../services/telemetry";

export class ErrorResponseHandler {
  private serviceName: string;
  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }
  public handleError(req: Request, res: Response, next: NextFunction, error: any, audit: boolean = true): any {
    console.error("Error in " + this.serviceName)
    console.error(JSON.stringify({
      "ts": Date.now(),
      "body": req.body,
      "headers": req.headers,
      "url": req.url,
      "error": {
        "message": error?.message,
        "stack": error?.stack,
        "data": error?.data,
        "code": error?.code,
        "error": error,
      }
    }));
    if(audit) setAuditState("failed", req);
    next({ 
        statusCode: error.status || httpStatus.INTERNAL_SERVER_ERROR, 
        message: error.message,
        errCode: httpStatus[`${error.status}_NAME`] || httpStatus["500_NAME"],
    });
  }
};
