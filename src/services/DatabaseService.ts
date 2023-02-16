import constants from "../resources/Constants.json";
import { NextFunction, Request, Response } from "express";
import { ResponseHandler } from "../helpers/ResponseHandler";
import errorResponse from "http-errors"
import httpStatus from "http-status";
import { Datasets } from "../utils/Datasets";
import { IConnector } from "../models/DatasetModels";
import { Datasources } from "../utils/Datasources";

export class DatabaseService {
    private connector: any;
    constructor(connector: IConnector) {
        this.connector = connector
    }
    public saveDataset = (req: Request, res: Response, next: NextFunction) => {
        const dataset = new Datasets(req.body)
        this.connector.insertRecord('datasets', dataset.setValues())
            .then(() => {
                ResponseHandler.successResponse(req, res, { status: 200, data: { "message": constants.RECORD.SAVED, "dataset_id": req.body.id} })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            });
    }
    public readDataset = (req: Request, res: Response, next: NextFunction) => {
        this.connector.readRecord('datasets', { "column": 'id', "value": req.query.id })
            .then((data: any) => {
                ResponseHandler.successResponse(req, res, { status: 200, data: data })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            });
    }
    public updateDataset = (req: Request, res: Response, next: NextFunction) => {
        const dataset = new Datasets(req.body)
        this.connector.updateRecord('datasets', { "column": 'id', "value": req.query.id }, dataset.setValues())
            .then(() => {
                ResponseHandler.successResponse(req, res, { status: 200, data: { "message": constants.RECORD.UPDATED, "dataset_id": req.query.id } })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            });
    }
    public saveDatasource = (req: Request, res: Response, next: NextFunction) => {
        const datasource = new Datasources(req.body)
        this.connector.insertRecord('datasources', datasource.setValues())
            .then(() => {
                ResponseHandler.successResponse(req, res, { status: 200, data: { "message": constants.RECORD.SAVED, "id": req.body.id } })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            });
    }
    public readDatasource = (req: Request, res: Response, next: NextFunction) => {
        this.connector.readRecord('datasources', { "column": 'id', "value": req.query.id })
            .then((data: any) => {
                ResponseHandler.successResponse(req, res, { status: 200, data: data })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            });
    }
    public updateDatasource = (req: Request, res: Response, next: NextFunction) => {
        const datasource = new Datasources(req.body)
        this.connector.updateRecord('datasources', { "column": 'id', "value": req.query.id }, datasource.setValues())
            .then(() => {
                ResponseHandler.successResponse(req, res, { status: 200, data: { "message": constants.RECORD.UPDATED, "id": req.query.id } })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            });
    }

}


