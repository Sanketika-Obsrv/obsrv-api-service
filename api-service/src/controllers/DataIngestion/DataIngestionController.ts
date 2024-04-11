import { Request, Response } from "express";
import * as _ from 'lodash';
import validationSchema from "./validationSchema.json";
import { schemaValidation } from "../../services/ValidationService";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { send } from "../../connections/kafkaConnection";
import { getDataset } from "../../services/DatasetService";
import logger from "../../logger";
import { v4 } from "uuid";
import { config } from "../../configs/Config";

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
            logger.error(`Dataset with id ${datasetId} not found in live table`)
            return ResponseHandler.errorResponse(errorObject.datasetNotFound, req, res);
        }
        const validData = validation(req.body, dataset);
        const entryTopic = _.get(dataset, "dataValues.dataset_config.entry_topic")
        if (!entryTopic) {
            logger.error("Entry topic not found")
            return ResponseHandler.errorResponse(errorObject.topicNotFound, req, res);
        }
        await send(addMetadataToEvents(validData, datasetId), _.get(dataset, "dataValues.dataset_config.entry_topic"))
        ResponseHandler.successResponse(req, res, { status: 200, data: { message: "Data ingested successfully" } });
    }
    catch (err: any) {
        logger.error(err)
        ResponseHandler.errorResponse(err, req, res);
    }
}

export const validation = (requestBody: any, dataset: Record<string, any>) => {
    const data = requestBody?.data;
    const extractionKey = _.get(dataset?.dataValues, "extraction_config.extraction_key");
    const isBatchEvent = _.get(dataset?.dataValues, "extraction_config.is_batch_event");
    const batchIdentifier = _.get(dataset?.dataValues, "extraction_config.batch_id")

    if (isBatchEvent && (_.has(data, extractionKey) && _.has(data, batchIdentifier))) {
        return data;
    }
    if (!_.isArray(_.get(data, "event"))) {
        return data;
    }
}

const addMetadataToEvents = (payload: any, datasetId: string) => {
    const now = Date.now();
    _.set(payload, 'syncts', now);
    _.set(payload, 'dataset', datasetId);
    if (!payload?.mid) _.set(payload, 'mid', v4());
    const source = { meta: { id: "", connector_type: "api", version: config?.version, entry_source: "api" }, trace_id: v4() };
    const obsrvMeta = { syncts: now, processingStartTime: now, flags: {}, timespans: {}, error: {}, source: source };
    _.set(payload, 'obsrv_meta', obsrvMeta);
    return payload;
}

export default dataIn;