import { Request, Response } from "express";
import logger from "../../logger";
import { getDraftDataset, setRedisDBConfig, validateDenormConfig } from "../../services/DatasetService";
import _ from "lodash";
import DatasetCreate from "./DatasetCreateValidationSchema.json";
import { schemaValidation } from "../../services/ValidationService";
import { DatasetDraft } from "../../models/DatasetDraft";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import { defaultDatasetConfig, defaultMasterConfig } from "../../configs/DatasetConfigDefault";
import { DatasetType } from "../../types/DatasetModels";

const Create = async (req: Request, res: Response) => {
    try {
        const datasetBody = req.body;
        const isRequestValid: Record<string, any> = schemaValidation(datasetBody, DatasetCreate)

        if (!isRequestValid.isValid) {
            return ResponseHandler.errorResponse({ message: isRequestValid.message, statusCode: 400, errCode: "BAD_REQUEST" }, req, res);
        }

        const isDataSetExists = await checkDatasetExists(_.get(req, ["body", "dataset_id"]));
        if (isDataSetExists) {
            return ResponseHandler.errorResponse({ message: "Dataset Record Already exists", statusCode: 400, errCode: "BAD_REQUEST" }, req, res);
        }

        const datasetPayload: any = await getDefaultValue(datasetBody);
        const response = await DatasetDraft.create(datasetPayload)
        logger.info("Dataset Record Created Successfully")
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { id: _.get(response, ["dataValues", "id"]) || "" } });
    } catch (error: any) {
        logger.error(error)
        ResponseHandler.errorResponse(error, req, res);
    }
}

const checkDatasetExists = async (dataset_id: string): Promise<boolean> => {
    const datasetExists = await getDraftDataset(dataset_id)
    if (datasetExists) {
        logger.error("Dataset Record Already exists")
        return true;
    } else {
        return false
    }
}

const mergeDatasetConfigs = (defaultConfig: Record<string, any>, requestPayload: Record<string, any>): Record<string, any> => {
    const { id, dataset_id, version = 1 } = requestPayload;
    const recordId = !id && `${dataset_id}.${version}`
    const modifyPayload = { ...requestPayload, ...(recordId && { id: recordId }) }
    const datasetConfigs = _.merge(defaultConfig, modifyPayload)
    return datasetConfigs
}

const getDatasetDefaults = async (payload: Record<string, any>): Promise<Record<string, any>> => {
    const isUniqDenormKeys = validateDenormConfig(_.get(payload, "denorm_config"))
    if (!isUniqDenormKeys) {
        logger.error("Duplicate denorm output fields found")
        throw { statusCode: 400, message: "Duplicate denorm output fields found", errCode: "BAD_REQUEST" }
    }
    const datasetPayload = mergeDatasetConfigs(defaultDatasetConfig, payload)
    return datasetPayload
}

const getMasterDatasetDefaults = async (payload: Record<string, any>): Promise<Record<string, any>> => {
    const isUniqDenormKeys = validateDenormConfig(_.get(payload, "denorm_config"))
    if (!isUniqDenormKeys) {
        logger.error("Duplicate denorm output fields found")
        throw { statusCode: 400, message: "Duplicate denorm output fields found", errCode: "BAD_REQUEST" }
    }
    const masterDatasetPayload = mergeDatasetConfigs(defaultMasterConfig, payload)
    let datasetConfig = masterDatasetPayload.dataset_config
    datasetConfig = await setRedisDBConfig(datasetConfig);
    return _.assign(masterDatasetPayload, datasetConfig);
}

const getDefaultHandler = (datasetType: string) => {
    switch (datasetType) {
        case DatasetType.Dataset: {
            return getDatasetDefaults;
        }
        case DatasetType.MasterDataset: {
            return getMasterDatasetDefaults;
        }
        default:
            return () => { };
    }
}

const getDefaultValue = async (payload: Record<string, any>) => {
    const datasetType = _.get(payload, "type");
    const getDatasetDefaults = getDefaultHandler(datasetType)
    return await getDatasetDefaults(payload)
}

export default Create;