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

        // this.connector.execute(`CREATE SEQUENCE IF NOT EXISTS uuid_seq START WITH 1000; CREATE TABLE IF NOT EXISTS schema_config (identifier VARCHAR(50) PRIMARY KEY, dataset_id VARCHAR(50) NOT NULL, dataset_schema jsonb NOT NULL, ingestion_schema jsonb NOT NULL, config jsonb, version VARCHAR(30) NOT NULL); INSERT INTO schema_config (identifier, dataset_id, dataset_schema, ingestion_schema, config, version) VALUES(CONCAT('SCHEMA', NEXTVAL('uuid_seq')), '${req.body.dataset}', '${JSON.stringify(req.body.dataSchema)}', '${JSON.stringify(req.body.ingestionSchema)}', '${JSON.stringify(req.body.config)}', '${req.body.version}'); SELECT identifier FROM schema_config ORDER BY identifier DESC LIMIT 1;`)
        //     .then((data: any) => {
        //         const uuid = data[3].rows[0].identifier
        //         ResponseHandler.successResponse(req, res, { status: 200, data: { "message": constants.SCHEMA.SAVED, "version": req.body.version || "1.0.0", "dataset": req.body.dataset, "id": uuid } })
        //     }).catch((error: any) => {
        //         next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
        //     });


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
