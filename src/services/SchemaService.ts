import constants from "../resources/constants.json";
import { NextFunction, Request, Response } from "express";
import { ResponseHandler } from "../helpers/responseHandler";
import { IConnector } from "../models/ingestionModels";
import errorResponse from "http-errors"
import httpStatus from "http-status";

export class SchemaService {
    private connector: IConnector
    constructor(connector: IConnector) {
        this.connector = connector
        this.init()
    }
    public init = () => {
        this.connector.connect()
    }
    public save = (req: Request, res: Response, next: NextFunction) => {
        this.connector.execute(`CREATE TABLE IF NOT EXISTS schema_config (dataset_id VARCHAR(50) PRIMARY KEY, dataset_schema jsonb NOT NULL, ingestion_schema jsonb NOT NULL, config jsonb NOT NULL, version REAL NOT NULL); INSERT INTO schema_config (dataset_id, dataset_schema, ingestion_schema, config, version) VALUES('${req.body.dataset}', '${JSON.stringify(req.body.dataSchema)}', '${JSON.stringify(req.body.ingestionSchema)}', '${JSON.stringify(req.body.config)}', ${req.body.version}) ON CONFLICT(dataset_id) DO UPDATE SET (dataset_schema, ingestion_schema, config, version)=(EXCLUDED.dataset_schema, EXCLUDED.ingestion_schema, EXCLUDED.config, coalesce((schema_config.version)+0.01, EXCLUDED.version))`)
            .then(() => {
                ResponseHandler.successResponse(req, res, { status: 200, data: { "message": constants.SCHEMA.SAVED, "dataset_id": req.body.dataset } })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            });
    }
    public read = (req: Request, res: Response, next: NextFunction) => {

        this.connector.execute(`SELECT * FROM schema_config WHERE dataset_id = '${req.query.dataset}'`)
            .then((data: any) => {
                ResponseHandler.successResponse(req, res, { status: 200, data: data.rows[0] })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            });
    }
}
