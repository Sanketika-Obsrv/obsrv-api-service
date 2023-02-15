import { NextFunction, Request, Response } from "express";
import errorResponse from "http-errors";
import httpStatus from "http-status";
import { SchemaGenerationException } from "../configs/exceptions/CustomExceptions";
import { DatasetSchema } from "../generators/DataSetSchema";
import { IngestionSchema } from "../generators/IngestionSchema";
import { ResponseHandler } from "../helpers/ResponseHandler";
import { IConnector } from "../models/DatasetModels";
import { IngestionConfig, IngestionSchemeRequest } from "../models/IngestionModels";
import { DatasetSchemeRequest } from "../models/SchemaModels";
export class SchemaGeneratorService {
    private connector: IConnector;
    constructor(connector: IConnector) {
        this.connector = connector
        this.connector.connect();
    }
    public generateIngestionSchema = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const request = <IngestionSchemeRequest>req.body
            const schema = new IngestionSchema(request.config.dataset, <IngestionConfig>request.config)
            const sample = new Map(Object.entries(request.schema));
            const spec = schema.generate(sample)
            ResponseHandler.successResponse(req, res, { status: 200, data: spec });
        } catch (error) {
            if (error instanceof SchemaGenerationException) {
                next(errorResponse((<SchemaGenerationException>error).statusCode, error.message));
            } else {
                next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, (<Error>error).message)));
            }
        }
    }

    public generateDataSetSchema = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const request = <DatasetSchemeRequest>req.body
            const schema = new DatasetSchema(request.config.dataset, request.config)
            const spec = schema.generate(request.data)
            ResponseHandler.successResponse(req, res, { status: 200, data: spec });
        } catch (error) {
            if (error instanceof SchemaGenerationException) {
                next(errorResponse((<SchemaGenerationException>error).statusCode, error.message));
            } else {
                next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, (<Error>error).message)));
            }

        }
    }
}