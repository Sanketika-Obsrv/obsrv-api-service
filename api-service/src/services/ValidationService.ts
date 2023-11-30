import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { IValidator, QValidator } from "../models/DatasetModels";
import { ValidationStatus } from "../models/ValidationModels";
import { QueryValidator } from "../validators/QueryValidator";
import { RequestsValidator } from "../validators/RequestsValidator";

export class ValidationService {

    private request: QValidator;
    private query: IValidator;
    constructor() {
        this.request = new RequestsValidator()
        this.query = new QueryValidator()
    }

    public validateRequestBody = async (req: Request, res: Response, next: NextFunction) => {
        const status: ValidationStatus = await this.request.validate(req.body, (req as any).id)
        status.isValid ?
            next()
            : next({ statusCode: httpStatus.BAD_REQUEST, message: status.message || "", errCode: status.code })
    };

    public validateRequestParams = async (req: Request, res: Response, next: NextFunction) => {
        const status: ValidationStatus = await this.request.validateQueryParams(req.query, (req as any).id)
        status.isValid ?
            next()
            : next({ statusCode: httpStatus.BAD_REQUEST, message: status.message || "", errCode: status.code })
    };

    public validateQuery = async (req: Request, res: Response, next: NextFunction) => {
        const status: ValidationStatus = await this.query.validate(req.body, (req as any).id)
        status.isValid ?
            next()
            : next({ statusCode: httpStatus.BAD_REQUEST, message: status.message || "", errCode: status.code })
    };
}
