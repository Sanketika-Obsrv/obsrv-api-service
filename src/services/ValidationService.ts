import { NextFunction, Request, Response } from "express";
import errorResponse from "http-errors";
import httpStatus from "http-status";
import { IValidator } from "../models/DatasetModels";
import { ValidationStatus } from "../models/ValidationModels";
import { QueryValidator } from "../validators/QueryValidator";
import { RequestsValidator } from "../validators/RequestsValidator";

export class ValidationService {

    private request: IValidator;
    private query: IValidator;
    constructor() {
        this.request = new RequestsValidator()
        this.query = new QueryValidator()
    }

    public validateRequestBody = (req: Request, res: Response, next: NextFunction) => {
        const status: ValidationStatus = this.request.validate(req.body, (req as any).id)
        status.isValid ?
            next()
            : next(errorResponse(httpStatus.BAD_REQUEST, status?.message || "", { errCode: httpStatus["400_NAME"] }))
    };

    public validateQuery = (req: Request, res: Response, next: NextFunction) => {
        const status: ValidationStatus = this.query.validate(req.body, (req as any).id)
        status.isValid ?
            next()
            : next(errorResponse(httpStatus.BAD_REQUEST, status?.message || "", { errCode: httpStatus["400_NAME"] }))
    }

}