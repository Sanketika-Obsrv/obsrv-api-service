import { NextFunction, Request, Response } from "express";
import { DataSetSchema } from "../generators/DataSetSchema";
import { IngestionConfig, IngestionSchema } from "../generators/IngestionSchema";
 
import { ResponseHandler } from "../helpers/responseHandler";
import { IConnector, IngestionSchemeRequest } from "../models/ingestionModels";
export class SchemaGeneratorService {
    private connector: IConnector;
    constructor(connector: IConnector) {
        this.connector = connector
        this.connector.connect();
    }
    public generateIngestionSchema = async (req: Request, res: Response, next: NextFunction) => {
        const request = <IngestionSchemeRequest>req.body
        const schema = new IngestionSchema(request.config.dataSet, <IngestionConfig>request.config)
        const spec = schema.generate(request.data)
        //console.log("spec " + JSON.stringify(spec))
        //const ress =  this.connector.execute(`INSERT INTO dataset_config (dataset_name, dataset_version, ingestion_schema, dataset_schema) VALUES (${request.config.dataSet}, 'v1', ${spec}, '{}')`)
        // ress.then((resss: { rows: any; }) => {
        //     console.log("data " + JSON.stringify(resss.rows))
        // })
        ResponseHandler.successResponse(req, res, { status: 200, data: spec });
    }

    public generateDataSetSchema = async (req: Request, res: Response, next: NextFunction) => {
        const request = <IngestionSchemeRequest>req.body
        const schema = new DataSetSchema(request.config.dataSet, new Map())
        const spec = schema.generate(request.data)
        // const ress =  this.connector.execute(`INSERT INTO dataset_config (dataset_name, dataset_version, ingestion_schema, dataset_schema) VALUES (${request.config.dataSet}, 'v1', {}, ${spec})`)
        // ress.then((resss: { rows: any; }) => {
        //     console.log("data " + JSON.stringify(resss.rows))
        // })
        ResponseHandler.successResponse(req, res, { status: 200, data: spec });
    }

}