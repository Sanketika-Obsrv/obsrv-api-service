import { Request, Response, NextFunction } from "express";
import { ResponseHandler } from "../helpers/responseHandler";
import { KafkaConnector } from "../connectors/KafkaConnector";
import { config } from "../configs/config";
import errorResponse from "http-errors";
import httpStatus from "http-status";
const kafkaConnector = new KafkaConnector(config.dataset_api.kafka.brokers)
const responseHandler = new ResponseHandler();



export class DatasetService {
    public createDataset = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await kafkaConnector.connect()
            await kafkaConnector.execute(JSON.stringify(req.body.data[0]), config.dataset_api.kafka.topics.create)
            responseHandler.successResponse(req, res, { status: 200, data: { "message": "The data has been successfully ingested", "dataset": config.dataset_api.kafka.topics.create } });
        }
        catch (error: any) {
            kafkaConnector.close()
            next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))
        }
    }
    public updateDataset = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await kafkaConnector.connect()
            await kafkaConnector.execute(JSON.stringify(req.body.data[0]), config.dataset_api.kafka.topics.mutate)
            responseHandler.successResponse(req, res, { status: 200, data: { "message": "The request has been successfully submitted for update", "dataset": config.dataset_api.kafka.topics.mutate } });
        }
        catch (error: any) {
            kafkaConnector.close()
            next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))

        }
    }
    public deleteDataset = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // TODO
            responseHandler.successResponse(req, res, { status: 200, data: { "message": "The request has been successfully submitted for deletion", "dataset": "telemetry-raw" } });
        }
        catch (error: any) {
            kafkaConnector.close()
            next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message))

        }
    }
}