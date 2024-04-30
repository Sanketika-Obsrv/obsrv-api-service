import { Request, Response } from "express";
import * as _ from 'lodash';
import validationSchema from "./validationSchema.json";
import { schemaValidation } from "../../services/ValidationService";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { send } from "../../connections/kafkaConnection";
import { getDataset, setReqDatasetId } from "../../services/DatasetService";
import logger from "../../logger";
import { config } from "../../configs/Config";

const errorObject = {
    datasetNotFound: {
        "message": "Dataset with id not found",
        "statusCode": 404,
        "errCode": "BAD_REQUEST",
        "code": "DATASET_NOT_FOUND"
    },
    topicNotFound: {
        "message": "Entry topic is not defined",
        "statusCode": 404,
        "errCode": "BAD_REQUEST",
        "code": "TOPIC_NOT_FOUND"
    }
}
const apiId = "api.data.in";
const errorCode = "DATASET_UPDATE_FAILURE"

const dataIn = async (req: Request, res: Response) => {
    try {
        const requestBody = req.body;
        const datasetId = req.params.datasetId.trim();
        setReqDatasetId(req, datasetId)
        
        const isValidSchema = schemaValidation(requestBody, validationSchema)
        if (!isValidSchema?.isValid) {
            logger.error({ apiId, message: isValidSchema?.message, code: "DATA_INGESTION_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST", code: "DATA_INGESTION_INVALID_INPUT" }, req, res);
        }
        const dataset = await getDataset(datasetId)
        if (!dataset) {
            logger.error({ apiId, message: `Dataset with id ${datasetId} not found in live table`, code: "DATASET_NOT_FOUND" })
            return ResponseHandler.errorResponse(errorObject.datasetNotFound, req, res);
        }
        const entryTopic = _.get(dataset, "dataValues.dataset_config.entry_topic")
        if (!entryTopic) {
            logger.error({ apiId, message: "Entry topic not found", code: "TOPIC_NOT_FOUND" })
            return ResponseHandler.errorResponse(errorObject.topicNotFound, req, res);
        }
        await send(addMetadataToEvents(datasetId, requestBody), _.get(dataset, "dataValues.dataset_config.entry_topic"))
        ResponseHandler.successResponse(req, res, { status: 200, data: { message: "Data ingested successfully" } });
    }
    catch (err: any) {
        const code = _.get(err, "code") || errorCode
        logger.error({ ...err, apiId, code })
        let errorMessage = err;
        const statusCode = _.get(err, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code: "DATA_INGESTION_FAILED", message: "Failed to ingest data" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const addMetadataToEvents = (datasetId: string, payload: any) => {
    const validData = _.get(payload, "data");
    const now = Date.now();
    const mid = _.get(payload, "params.msgid");
    const source = { id: "api.data.in", version: config?.version, entry_source: "api" };
    const obsrvMeta = { syncts: now, flags: {}, timespans: {}, error: {}, source: source };
    if (Array.isArray(validData)) {
        const payloadRef = validData.map((event: any) => {
            event = _.set(event, 'obsrv_meta', obsrvMeta);
            event = _.set(event, 'dataset', datasetId);
            event = _.set(event, 'msgid', mid);
            return event
        })
        return payloadRef;
    }
    else {
        _.set(validData, 'msgid', mid);
        _.set(validData, 'obsrv_meta', obsrvMeta);
        _.set(validData, 'dataset', datasetId);
        return validData
    }
}

export default dataIn;
