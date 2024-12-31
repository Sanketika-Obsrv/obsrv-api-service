import { Request, Response } from "express";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import _ from "lodash";
import { datasetService, validateStorageSupport } from "../../services/DatasetService";
import { datasetImportValidation, migrateExportedDatasetV1 } from "./DatasetImportHelper";
import { obsrvError } from "../../types/ObsrvError";

const datasetImport = async (req: Request, res: Response) => {

    const { overwrite = "true" } = req.query;
    const requestBody = req.body
    let datasetPayload = requestBody.request;
    if (_.get(datasetPayload, "api_version") !== "v2") {
        const migratedConfigs = migrateExportedDatasetV1(requestBody)
        datasetPayload = migratedConfigs;
    }
    const userID = (req as any)?.userID;
    _.set(datasetPayload, "created_by", userID);
    _.set(datasetPayload, "updated_by", userID);
    const { updatedDataset, ignoredFields } = await datasetImportValidation({ ...requestBody, "request": datasetPayload })
    const { successMsg, partialIgnored } = getResponseData(ignoredFields)

    validateStorageSupport(updatedDataset);
    const dataset = await importDataset(updatedDataset, overwrite, userID);
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: successMsg, data: dataset, ...(!_.isEmpty(partialIgnored) && { ignoredFields: partialIgnored }) } });
}

const importDataset = async (dataset: Record<string, any>, overwrite: string | any, userID : string) => {
    const dataset_id = _.get(dataset,"dataset_id")
    const response = await datasetService.createDraftDataset(dataset).catch(err => { return err })
    if (response?.name === "SequelizeUniqueConstraintError") {
        if (overwrite === "true") {
            _.set(dataset, "updated_by", userID);
            const overwriteRes = await datasetService.updateDraftDataset(dataset).catch(()=>{
                throw obsrvError(dataset_id, "DATASET_IMPORT_FAILURE", `Failed to import dataset: ${dataset_id} as overwrite failed`, "INTERNAL_SERVER_ERROR", 500);
            })
            return _.omit(overwriteRes, ["message"])
        } else {
            throw obsrvError(dataset_id, "DATASET_EXISTS", `Dataset with dataset_id: ${dataset_id} already exists.`, "CONFLICT", 409);
        }
    }
    if(response?.errors){
        throw obsrvError("", "DATASET_IMPORT_FAILURE", `Failed to import dataset: ${dataset_id}`, "INTERNAL_SERVER_ERROR", 500);
    }
    return response
}

const getResponseData = (ignoredConfigs: Record<string, any>) => {
    const { ignoredConnectors, ignoredTransformations, ignoredDenorms } = ignoredConfigs;
    let successMsg = "Dataset is imported successfully";
    const partialIgnored: Record<string, any> = {};

    if (ignoredConnectors.length || ignoredTransformations.length || ignoredDenorms.length) {
        successMsg = "Dataset is partially imported";

        if (ignoredTransformations.length) {
            partialIgnored.transformations = ignoredTransformations;
        }
        if (ignoredConnectors.length) {
            partialIgnored.connectors = ignoredConnectors;
        }
        if (ignoredDenorms.length) {
            partialIgnored.denorm_fields = ignoredDenorms;
        }
    }

    return { successMsg, partialIgnored };
}

export default datasetImport;