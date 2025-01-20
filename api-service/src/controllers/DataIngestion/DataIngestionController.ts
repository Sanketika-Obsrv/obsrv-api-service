import { Request, Response } from "express";
import * as _ from "lodash";
import validationSchema from "./validationSchema.json";
import { schemaValidation } from "../../services/ValidationService";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { send } from "../../connections/kafkaConnection";
import { datasetService } from "../../services/DatasetService";
import logger from "../../logger";
import { config } from "../../configs/Config";
import { obsrvError } from "../../types/ObsrvError";

const errorObject = {
    topicNotFound: {
        "message": "Entry topic is not defined",
        "statusCode": 404,
        "errCode": "BAD_REQUEST",
        "code": "TOPIC_NOT_FOUND"
    }
}
const apiId = "api.data.in";

const requestValidation = async (req: Request) => {
    const datasetKey = req.params.dataset_id.trim();

    const isValidSchema = schemaValidation(req.body, validationSchema)
    if (!isValidSchema?.isValid) {
        throw obsrvError("", "DATA_INGESTION_INVALID_INPUT", isValidSchema?.message, "BAD_REQUEST", 400)
    }
    let dataset = await datasetService.getDatasetWithAlias(datasetKey, ["id", "entry_topic", "api_version", "dataset_config", "dataset_id", "extraction_config"], true) //dataset check considering datakey as alias name
    if (_.isEmpty(dataset)) {
        logger.info({ apiId, message: `Dataset with alias '${datasetKey}' does not exist` })
        dataset = await datasetService.getDataset(datasetKey, ["id", "entry_topic", "api_version", "dataset_config", "dataset_id", "extraction_config"], true) //dataset check considering datakey as dataset_id
        if (_.isEmpty(dataset)) {
            throw obsrvError(datasetKey, "DATASET_NOT_FOUND", `Dataset with id/alias name '${datasetKey}' not found`, "NOT_FOUND", 404)
        }
    }
    return dataset
}

const dataIn = async (req: Request, res: Response) => {

    const dataset = await requestValidation(req)
    const { entry_topic, dataset_config, extraction_config, api_version, dataset_id } = dataset
    const entryTopic = api_version !== "v2" ? _.get(dataset_config, "entry_topic") : entry_topic
    if (!entryTopic) {
        logger.error({ apiId, message: "Entry topic not found", code: "TOPIC_NOT_FOUND" })
        return ResponseHandler.errorResponse(errorObject.topicNotFound, req, res);
    }
    await send(addMetadataToEvents(dataset_id, req.body, extraction_config), entryTopic)
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
