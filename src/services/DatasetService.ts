import { Request, Response, NextFunction } from "express";
import { ResponseHandler } from "../helpers/ResponseHandler";
import { config } from "../configs/Config";
import constants from "../resources/Constants.json"
import errorResponse from "http-errors";
import httpStatus from "http-status";
import { IConnector } from "../models/IngestionModels";
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
                responseHandler.successResponse(req, res, { status: 200, data: { "message": constants.DATASET.CREATED, "dataset_id": config.dataset_api.kafka.topics.create } })
            }).catch((error: any) => {
                next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
            })
    }
}