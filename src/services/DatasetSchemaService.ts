import constants from "../resources/constants.json";
import { NextFunction, Request, Response } from "express";
import { ResponseHandler } from "../helpers/responseHandler";
import errorResponse from "http-errors"
import httpStatus from "http-status";
import { Datasets } from "../utils/Datasets";
import { IConnector } from "../models/DatasetModels";

export class DatasetSchemaService {
    private connector: any;
    constructor(connector: IConnector) {
        this.connector = connector
    }
    public save = (req: Request, res: Response, next: NextFunction) => {
        const datasets = new Datasets(req.body)
        this.connector.insertRecord('datasets', datasets.getColumns())
            .then(() => {
                ResponseHandler.successResponse(req, res, { status: 200, data: { "message": constants.SCHEMA.SAVED, "dataset_id": req.body.dataset } })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            });
    }

    // public read = (req: Request, res: Response, next: NextFunction) => {
    //     this.connector.execute(`SELECT * FROM schema_config WHERE dataset_id = '${req.query.dataset}'`)
    //         .then((data: any) => {
    //             ResponseHandler.successResponse(req, res, { status: 200, data: data.rows[0] })
    //         }).catch((error: any) => {
    //             next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
    //         });
    // }
}

