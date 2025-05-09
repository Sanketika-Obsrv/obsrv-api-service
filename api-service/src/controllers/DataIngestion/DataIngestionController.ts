import { Request, Response } from "express";
import * as _ from "lodash";
import validationSchema from "./validationSchema.json";
import { schemaValidation } from "../../services/ValidationService";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { send } from "../../connections/kafkaConnection";
import { datasetService } from "../../services/DatasetService";
import { config } from "../../configs/Config";
import { obsrvError } from "../../types/ObsrvError";

const apiId = "api.data.in";

const requestValidation = async (req: Request) => {
    const datasetKey = req.params.dataset_id.trim();

    const isValidSchema = schemaValidation(req.body, validationSchema)
    if (!isValidSchema?.isValid) {
        throw obsrvError("", "DATA_INGESTION_INVALID_INPUT", isValidSchema?.message, "BAD_REQUEST", 400)
    }
    const dataset = await datasetService.getDatasetWithDatasetkey(datasetKey, ["id", "entry_topic", "api_version", "dataset_config", "dataset_id", "extraction_config"], true)
    if (_.isEmpty(dataset)) {
        throw obsrvError(datasetKey, "DATASET_NOT_FOUND", `Dataset with id/alias name '${datasetKey}' not found`, "NOT_FOUND", 404)
    }
    _.set(req, "body.request.dataset_id", dataset.dataset_id);
    return dataset
}

const dataIn = async (req: Request, res: Response) => {

    const dataset = await requestValidation(req)
    const { entry_topic, dataset_config, extraction_config, api_version, dataset_id } = dataset
    const entryTopic = api_version !== "v2" ? _.get(dataset_config, "entry_topic") : entry_topic
    if (!entryTopic) {
        throw obsrvError(dataset_id, "TOPIC_NOT_FOUND", `Entry topic not found`, "NOT_FOUND", 404)
    }
    await send(addMetadataToEvents(dataset_id, req.body, extraction_config), entryTopic)
    ResponseHandler.successResponse(req, res, { status: 200, data: { message: "Data ingested successfully" } });

}

const addMetadataToEvents = (datasetId: string, payload: any, extraction_config: any) => {
    const validData = _.get(payload, "data");
    const now = Date.now();
    const mid = _.get(payload, "params.msgid");
    const source = { connector: 'api', connectorInstance: 'api' };
    const obsrvMeta = { syncts: now, flags: {}, timespans: {}, error: {}, source };
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
