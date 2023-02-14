import { Request, Response, NextFunction } from "express";
import { ResponseHandler } from "../helpers/responseHandler";
import { config } from "../configs/config";
import constants from "../resources/constants.json"
import errorResponse from "http-errors";
import httpStatus from "http-status";
import { IConnector } from "../models/ingestionModels";
const responseHandler = ResponseHandler;

export class DatasetService {
    private connector: any;
    constructor(connector: IConnector) {
        this.connector = connector
        this.init()
    }
    public init = () => {
        this.connector.connect()
            .then(() => console.info("Kafka Connection Established..."))
            .catch((err: Error) => console.error(`Kafka Connection failed ${err.message}`))
    }
    public create = (req: Request, res: Response, next: NextFunction) => {
        this.connector.execute(config.dataset_api.kafka.topics.create, { "value": JSON.stringify(req.body.data) })
            .then(() => {
                responseHandler.successResponse(req, res, { status: 200, data: { "message": constants.DATASET.CREATED } })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            })
    }
}