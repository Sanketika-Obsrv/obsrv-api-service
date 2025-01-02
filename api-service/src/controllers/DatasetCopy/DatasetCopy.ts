
import { Request, Response } from "express";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import * as _ from "lodash";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./RequestValidationSchema.json";
import { datasetService, getLiveDatasetConfigs, validateStorageSupport } from "../../services/DatasetService";
import { updateRecords } from "./DatasetCopyHelper";
import { obsrvError } from "../../types/ObsrvError";

export const apiId = "api.dataset.copy";

const validateRequest = (req: Request) => {

    const isValidSchema = schemaValidation(req.body, validationSchema);
    if (!isValidSchema?.isValid) {
        throw obsrvError("", "DATASET_COPY_INVALID_INPUT", isValidSchema.message, "BAD_REQUEST", 400);
    }
}

const fetchDataset = async (req: Request) => {
    const datasetId = _.get(req, "body.request.source.datasetId");
    const isLive = _.get(req, "body.request.source.isLive");

    let dataset = isLive ? await getLiveDatasetConfigs(datasetId) : await datasetService.getDraftDataset(datasetId)
    if (!dataset) {
        throw obsrvError(datasetId, "DATASET_NOT_EXISTS", `Dataset ${datasetId} does not exists`, "NOT_FOUND", 404);
    }

    if (_.get(dataset, "api_version") != "v2") {
        const migratedConfigs = await datasetService.migrateDatasetV1(datasetId, dataset)
        dataset = { ...dataset, ...migratedConfigs }
    }

    return dataset;
}

const datasetCopy = async (req: Request, res: Response) => {

    validateRequest(req);
    const newDatasetId = _.get(req, "body.request.destination.datasetId");
    const dataset = await fetchDataset(req);
    validateStorageSupport(dataset);
    const userID = (req as any)?.userID;
    _.set(dataset, "created_by", userID);
    _.set(dataset, "updated_by", userID);
    updateRecords(dataset, newDatasetId)
    const response = await datasetService.createDraftDataset(dataset).catch(err => {
        if (err?.name === "SequelizeUniqueConstraintError") {
            throw obsrvError(newDatasetId, "DATASET_ALREADY_EXISTS", `Dataset with id ${newDatasetId} already exists`, "BAD_REQUEST", 400);
        }
        throw obsrvError(newDatasetId, "DATASET_COPY_FAILURE", `Failed to clone dataset`, "INTERNAL_SERVER_ERROR", 500);
    });
    return ResponseHandler.successResponse(req, res, { status: 200, data: { dataset_id: _.get(response, "id"), message: `Dataset clone successful` } });
}

export default datasetCopy;