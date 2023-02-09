import { NextFunction, Request, Response } from "express";
import { DataSetSchema } from "../generators/DataSetSchema";
import { IngestionSchemaV2 } from "../generators/IngestionSchemaV2";
import { ResponseHandler } from "../helpers/responseHandler";
import { DataSchemeRequest, IConnector, IngestionConfig, IngestionSchemeRequest } from "../models/ingestionModels";
export class SchemaGeneratorService {
    private connector: IConnector;
    constructor(connector: IConnector) {
        this.connector = connector
        this.connector.connect();
    }
    public generateIngestionSchema = async (req: Request, res: Response, next: NextFunction) => {
        const request = <IngestionSchemeRequest>req.body
        const schema = new IngestionSchemaV2(request.config.dataSet, <IngestionConfig>request.config)
        const sample = new Map(Object.entries(request.schema));
        const spec = schema.generate(sample)
        ResponseHandler.successResponse(req, res, { status: 200, data: spec });
    }

    public generateDataSetSchema = async (req: Request, res: Response, next: NextFunction) => {
        const request = <DataSchemeRequest>req.body
        const schema = new DataSetSchema(request.config.dataSet, new Map())
        const spec = schema.generate(request.data)
        ResponseHandler.successResponse(req, res, { status: 200, data: spec });
    }

}