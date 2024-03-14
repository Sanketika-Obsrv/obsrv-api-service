import { Request, Response } from "express";
import * as _ from 'lodash';
import dataIngestorSchema from "./DataIngestion.json";
import { schemaValidation } from "../../services";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { send } from "../../connections/kafkaConnection";
import { Dataset } from "../../models/Dataset";

const dataIn = async (req: Request, res: Response) => {
    try {
        const datasetId = getDatasetId(req);
        schemaValidation(req.body, dataIngestorSchema)
        req.body = { ...req.body.data, dataset: datasetId };
        const datasetRecord = await getDatasetRecord(datasetId)
        const validData = await validation(req.body, datasetId);
        await send(validData, _.get(datasetRecord, "dataValues.dataset_config.entry_topic", ""))
        ResponseHandler.successResponse(req, res, { status: 200, data: { message: "Data ingestion successful." } });
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
        throw {
            "message": "datasetId parameter in url cannot be empty",
            "statusCode": 400,
            "errCode": "BAD_REQUEST"
        };
    }
}

export const getDatasetRecord = async (datasetId: string) => {
    const dataset = await Dataset.findOne({
        where: {
            id: datasetId,
        },
    });
    if (dataset !== null) {
        return dataset
    }
    else {
        throw {
            "message": "Dataset with id not found",
            "statusCode": 404,
            "errCode": "BAD_REQUEST"
        }
    }
}

const validation = async (data: any, datasetId: string) => {
    const datasetRecord: any = await getDatasetRecord(datasetId);
    if (_.has(datasetRecord?.dataValues, "extraction_config") && _.get(datasetRecord?.dataValues, ["extraction_config", "is_batch_event"])) {
        if (_.has(data, "id") && _.has(data, "events"))
            return data;
        else throw {
            "message": "Invalid dataset config provided for ingestion",
            "statusCode": 400,
            "errCode": "BAD_REQUEST"
        };
    } else {
        if (_.has(data, "event"))
            return data;
        else throw {
            "message": "Invalid dataset config provided for ingestion",
            "statusCode": 400,
            "errCode": "BAD_REQUEST"
        }
    }
}

export default dataIn;