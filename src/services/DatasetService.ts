import { Request, Response, NextFunction } from "express";
import { ResponseHandler } from "../helpers/responseHandler";
import { KafkaConnector } from "../connectors/KafkaConnector";
import { config } from "../configs/config";
import constants from "../resources/constants.json"
import errorResponse from "http-errors";
import httpStatus from "http-status";
const kafkaConnector = new KafkaConnector(config.dataset_api.kafka.brokers)
const responseHandler = ResponseHandler;



export class DatasetService {
    public create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await kafkaConnector.connect()
            await kafkaConnector.execute(JSON.stringify(req.body.data[0]), config.dataset_api.kafka.topics.create)
            responseHandler.successResponse(req, res, { status: 200, data: { "message": constants.DATASET.CREATED, "dataset": config.dataset_api.kafka.topics.create } });
        }
        catch (error: any) {
            kafkaConnector.close()
            next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
        }
    }
    public update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await kafkaConnector.connect()
            await kafkaConnector.execute(JSON.stringify(req.body.data[0]), config.dataset_api.kafka.topics.mutate)
            responseHandler.successResponse(req, res, { status: 200, data: { "message": constants.DATASET.UPDATED, "dataset": config.dataset_api.kafka.topics.mutate } });
        }
        catch (error: any) {
            kafkaConnector.close()
            next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))

        }
    }
    public delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            
            await kafkaConnector.connect()
            await kafkaConnector.execute(JSON.stringify(req.query), config.dataset_api.kafka.topics.mutate)
            responseHandler.successResponse(req, res, { status: 200, data: { "message": constants.DATASET.DELETED, "dataset": config.dataset_api.kafka.topics.mutate} });
        }
        catch (error: any) {
            kafkaConnector.close()
            next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))

        }
    }
}