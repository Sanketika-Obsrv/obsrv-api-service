import { Request, Response } from "express";
import * as _ from 'lodash';
import dataIngestorSchema from "./DataIngestion.json";
import { schemaValidation } from "../../services/ValidationService";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { send } from "../../connections/kafkaConnection";
import { getDataset } from "../../services/DatasetService";

const errorObject = {
    invalidParam: {
        "message": "datasetId parameter in url cannot be empty",
        "statusCode": 400,
        "errCode": "BAD_REQUEST"
    },
    invalidRequestBody: {
        "message": "Invalid dataset config provided for ingestion",
        "statusCode": 400,
        "errCode": "BAD_REQUEST"
    }
}

const dataIn = async (req: Request, res: Response) => {
    try {
        const datasetId = getDatasetId(req);
        schemaValidation(req.body, dataIngestorSchema)
        const dataset = await getDataset(datasetId)
        const validData = await validation(req.body?.data, datasetId);
        await send(validData, _.get(dataset, "dataValues.dataset_config.entry_topic", ""))
        ResponseHandler.successResponse(req, res, { status: 200, data: { message: "Data ingested successfully" } });
    }
    catch (err: any) {
        ResponseHandler.errorResponse(err, req, res);
    }
}

const getDatasetId = (req: Request) => {
    const datasetId = req.params.datasetId.trim()
    if (!_.isEmpty(datasetId)) {
        return datasetId
    }
    else {
        throw errorObject.invalidParam
    }
}

const validation = async (data: any, datasetId: string) => {
    const dataset: any = await getDataset(datasetId);
    const extractionKey = _.get(dataset?.dataValues, "extraction_config.extraction_key");
    const isBatchEvent = _.get(dataset?.dataValues, "extraction_config.is_batch_event");
    const batchIdentifier = _.get(dataset?.dataValues, "extraction_config.batch_id")

    if (isBatchEvent && _.has(data, extractionKey) && _.has(data, batchIdentifier)) {
        return data;
    }
    else if (!isBatchEvent && _.has(data, "event")) {
        return data
    }
    else throw errorObject.invalidRequestBody
}

export default dataIn;