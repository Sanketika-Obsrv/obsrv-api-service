import { Request, Response } from "express";
import * as _ from 'lodash';
import validationSchema from "./validationSchema.json";
import { schemaValidation } from "../../services/ValidationService";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { send } from "../../connections/kafkaConnection";
import { getDataset } from "../../services/DatasetService";
import logger from "../../logger";

const errorObject = {
    invalidRequestBody: {
        "message": "Invalid dataset config provided for ingestion",
        "statusCode": 400,
        "errCode": "BAD_REQUEST"
    },
    datasetNotFound: {
        "message": "Dataset with id not found",
        "statusCode": 404,
        "errCode": "BAD_REQUEST"
    },
    topicNotFound: {
        "message": "Entry topic is not defined",
        "statusCode": 404,
        "errCode": "BAD_REQUEST"
    }
}

const dataIn = async (req: Request, res: Response) => {
    try {
        const datasetId = req.params.datasetId.trim();
        const isValidSchema = schemaValidation(req.body, validationSchema)
        if (!isValidSchema?.isValid) {
            return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST" }, req, res);
        }
        const dataset = await getDataset(datasetId)
        if (!dataset) {
            logger.error("Dataset with specified id not found in live table")
            return ResponseHandler.errorResponse(errorObject.datasetNotFound, req, res);
        }
        const validData = await validation(req.body?.data, datasetId);
        const entryTopic = _.get(dataset, "dataValues.dataset_config.entry_topic")
        if (!entryTopic) {
            logger.error("Entry topic not found")
            return ResponseHandler.errorResponse(errorObject.topicNotFound, req, res);
        }
        await send(validData, _.get(dataset, "dataValues.dataset_config.entry_topic"))
        logger.info("Data ingested successfully");
        ResponseHandler.successResponse(req, res, { status: 200, data: { message: "Data ingested successfully" } });
    }
    catch (err: any) {
        logger.error(err)
        ResponseHandler.errorResponse(err, req, res);
    }
}

export const validation = async (data: any, datasetId: string) => {
    const dataset: any = await getDataset(datasetId);
    const extractionKey = _.get(dataset?.dataValues, "extraction_config.extraction_key");
    const isBatchEvent = _.get(dataset?.dataValues, "extraction_config.is_batch_event");
    const batchIdentifier = _.get(dataset?.dataValues, "extraction_config.batch_id")

    if (isBatchEvent) {
        if ((_.has(data, extractionKey) && _.has(data, batchIdentifier)) || _.has(data, "event")) {
            return data;
        }
    } else {
        if (_.has(data, "event")) {
            return data;
        }
    }
    throw errorObject.invalidRequestBody;
}

export default dataIn;