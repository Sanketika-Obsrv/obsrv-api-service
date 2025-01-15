import { Request, Response } from "express";
import * as _ from "lodash";
import validationSchema from "./validationSchema.json";
import { schemaValidation } from "../../services/ValidationService";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { send } from "../../connections/kafkaConnection";
import { datasetService } from "../../services/DatasetService";
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

const dataIn = async (req: Request, res: Response) => {

    const requestBody = req.body;
        const datasetId = req.params.dataset_id.trim();

        const isValidSchema = schemaValidation(requestBody, validationSchema)
        if (!isValidSchema?.isValid) {
            logger.error({ apiId, message: isValidSchema?.message, code: "DATA_INGESTION_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST", code: "DATA_INGESTION_INVALID_INPUT" }, req, res);
        }
        const dataset = await datasetService.getDataset(datasetId, ["id", "entry_topic", "api_version", "dataset_config"], true)
        if (!dataset) {
            logger.error({ apiId, message: `Dataset with id ${datasetId} not found in live table`, code: "DATASET_NOT_FOUND" })
            return ResponseHandler.errorResponse(errorObject.datasetNotFound, req, res);
        }
        const { entry_topic, dataset_config, extraction_config, api_version } = dataset
        const entryTopic = api_version !== "v2" ? _.get(dataset_config, "entry_topic") : entry_topic
        if (!entryTopic) {
            logger.error({ apiId, message: "Entry topic not found", code: "TOPIC_NOT_FOUND" })
            return ResponseHandler.errorResponse(errorObject.topicNotFound, req, res);
        }
        await send(addMetadataToEvents(datasetId, requestBody, extraction_config), entryTopic)
        ResponseHandler.successResponse(req, res, { status: 200, data: { message: "Data ingested successfully" } });

}

const addMetadataToEvents = (datasetId: string, payload: any, extraction_config: any) => {
    const validData = _.get(payload, "data");
    const now = Date.now();
    const mid = _.get(payload, "params.msgid");
    const source = { id: "api.data.in", version: config?.version, entry_source: "api" };
    const obsrvMeta = { syncts: now, flags: {}, timespans: {}, error: {}, source: source };
    if (Array.isArray(validData)) {
        const extraction_key: string = _.get(extraction_config, "extraction_key", 'events');
        const dedup_key: string = _.get(extraction_config, "dedup_config.dedup_key", 'id');
            const payload: any = {
                "obsrv_meta": obsrvMeta,
                "dataset": datasetId,
                "msgid": mid
            };
            payload[extraction_key] = validData;
            payload[dedup_key] = mid
            return payload;
    }
    else {
        return ({
            "event": validData,
            "obsrv_meta": obsrvMeta,
            "dataset": datasetId,
            "msgid": mid
        });
    }
}

export default dataIn;
