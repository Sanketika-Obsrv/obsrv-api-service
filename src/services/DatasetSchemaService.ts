import constants from "../resources/Constants.json";
import { NextFunction, Request, Response } from "express";
import { ResponseHandler } from "../helpers/ResponseHandler";
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
        this.connector.insertRecord('datasets', datasets.insertColumns())
            .then(() => {
                ResponseHandler.successResponse(req, res, { status: 200, data: { "message": constants.SCHEMA.SAVED, "dataset_id": req.body.dataset } })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            });
    }
    public read = (req: Request, res: Response, next: NextFunction) => {
        this.connector.readRecord('datasets', req.query.id)
            .then((data: any) => {
                ResponseHandler.successResponse(req, res, { status: 200, data: data })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            });
    }
    public update = (req: Request, res: Response, next: NextFunction) => {
        const datasets = new Datasets(req.body)
        this.connector.updateRecord('datasets', "telemetry-raw", datasets.updateColumns())
            .then(() => {
                ResponseHandler.successResponse(req, res, { status: 200, data: {"message": constants.SCHEMA.SAVED} })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            });
    }
}

