import { Request, Response } from "express";
import logger from "../../logger";
import { getDraftDataset, getDuplicateDenormKey, setReqDatasetId } from "../../services/DatasetService";
import _ from "lodash";
import DatasetCreate from "./DatasetCreateValidationSchema.json";
import { schemaValidation } from "../../services/ValidationService";
import { DatasetDraft } from "../../models/DatasetDraft";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import { defaultDatasetConfig, defaultMasterConfig } from "../../configs/DatasetConfigDefault";
import { DatasetType } from "../../types/DatasetModels";
import { query } from "../../connections/databaseConnection";
import { ErrorObject } from "../../types/ResponseModel";

export const apiId = "api.datasets.create"

const datasetCreate = async (req: Request, res: Response) => {
    try {
        const datasetId = _.get(req, ["body", "request", "dataset_id"])
        setReqDatasetId(req, datasetId)
        
        const isRequestValid: Record<string, any> = schemaValidation(req.body, DatasetCreate)

        if (!isRequestValid.isValid) {
            const code = "DATASET_INVALID_INPUT"
            logger.error({ code, apiId, message: isRequestValid.message })
            return ResponseHandler.errorResponse({
                code,
                message: isRequestValid.message,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const datasetBody = req.body.request;
        const isDataSetExists = await checkDatasetExists(_.get(datasetBody, ["dataset_id"]));
        if (isDataSetExists) {
            const code = "DATASET_EXISTS"
            logger.error({ code, apiId, message: `Dataset Already exists with id:${_.get(datasetBody, "dataset_id")}` })
            return ResponseHandler.errorResponse({
                code,
                message: "Dataset already exists",
                statusCode: 409,
                errCode: "CONFLICT"
            } as ErrorObject, req, res);
        }

        const duplicateDenormKeys = getDuplicateDenormKey(_.get(datasetBody, "denorm_config"))
        if (!_.isEmpty(duplicateDenormKeys)) {
            const code = "DATASET_DUPLICATE_DENORM_KEY"
            logger.error({ code, apiId, message: `Duplicate denorm output fields found. Duplicate Denorm out fields are [${duplicateDenormKeys}]` })
            return ResponseHandler.errorResponse({
                code,
                statusCode: 400,
                message: "Duplicate denorm key found",
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const datasetPayload: any = await getDefaultValue(datasetBody);
        const data = { ...datasetPayload, version_key: Date.now().toString() }
        const response = await DatasetDraft.create(data)
        logger.info({ apiId, message: `Dataset Created Successfully with id:${_.get(response, ["dataValues", "id"])}` })
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { id: _.get(response, ["dataValues", "id"]) || "", version_key: data.version_key } });
    } catch (error: any) {
        logger.error(error)
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code: "DATASET_CREATION_FAILURE", message: "Failed to create dataset" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const checkDatasetExists = async (dataset_id: string): Promise<boolean> => {
    const datasetExists = await getDraftDataset(dataset_id)
    if (datasetExists) {
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
    const datasetPayload = mergeDatasetConfigs(defaultDatasetConfig, payload)
    return datasetPayload
}

const setRedisDBConfig = async (datasetConfig: Record<string, any>): Promise<Record<string, any>> => {
    let nextRedisDB = datasetConfig.redis_db;
    const { results }: any = await query("SELECT nextval('redis_db_index')")
    if (!_.isEmpty(results)) nextRedisDB = parseInt(_.get(results, "[0].nextval")) || 3;
    return _.assign(datasetConfig, { "redis_db": nextRedisDB })
}

const getMasterDatasetDefaults = async (payload: Record<string, any>): Promise<Record<string, any>> => {
    const masterDatasetPayload = mergeDatasetConfigs(defaultMasterConfig, payload)
    let datasetConfig = masterDatasetPayload.dataset_config
    datasetConfig = await setRedisDBConfig(datasetConfig);
    return _.assign(masterDatasetPayload, datasetConfig);
}

const getDefaultHandler = (datasetType: string) => {
    if (datasetType == DatasetType.Dataset) {
        return getDatasetDefaults;
    } else {
        return getMasterDatasetDefaults;
    }
}

const getDefaultValue = async (payload: Record<string, any>) => {
    const datasetType = _.get(payload, "type");
    const getDatasetDefaults = getDefaultHandler(datasetType)
    return await getDatasetDefaults(payload)
}

export default datasetCreate;