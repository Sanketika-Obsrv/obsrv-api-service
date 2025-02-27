import _ from "lodash";
import { Request, Response } from "express";
import httpStatus from "http-status";
import { datasetService, validateStorageSupport } from "../../services/DatasetService";
import DatasetCreate from "./DatasetCreateValidationSchema.json";
import { schemaValidation } from "../../services/ValidationService";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { cipherService } from "../../services/CipherService";
import { defaultDatasetConfig } from "../../configs/DatasetConfigDefault";
import { obsrvError } from "../../types/ObsrvError";

export const apiId = "api.datasets.create"

const validateRequest = async (req: Request) => {

    const isRequestValid: Record<string, any> = schemaValidation(req.body, DatasetCreate)
    if (!isRequestValid.isValid) {
        throw obsrvError("", "DATASET_INVALID_INPUT", isRequestValid.message, "BAD_REQUEST", 400)
    }
    const datasetId = _.get(req, ["body", "request", "dataset_id"])
    const isDataSetExists = await datasetService.checkDatasetExists(datasetId);
    if (isDataSetExists) {
        throw obsrvError(datasetId, "DATASET_EXISTS", `Dataset Already exists with id:${datasetId}`, "CONFLICT", 409)
    }
    const isDatasourceExists = await datasetService.checkDatasourceExist(datasetId);
    if (isDatasourceExists) {
        throw obsrvError(datasetId, "DATASOURCE_EXISTS", `Datasource Already exists with id:${datasetId}`, "CONFLICT", 409)
    }

    const duplicateDenormKeys = datasetService.getDuplicateDenormKey(_.get(req, ["body", "request", "denorm_config"]))
    if (!_.isEmpty(duplicateDenormKeys)) {
        throw obsrvError(datasetId, "DATASET_DUPLICATE_DENORM_KEY", "Duplicate denorm output fields found.", "BAD_REQUEST", 400, undefined, {duplicateKeys: duplicateDenormKeys})
    }

    validateStorageSupport(_.get(req, ["body", "request"]))
}

const datasetCreate = async (req: Request, res: Response) => {
    
    await validateRequest(req)
    const draftDataset = getDraftDataset(req.body.request)
    const userID = (req as any)?.userID;
    _.set(draftDataset, "created_by", userID);
    _.set(draftDataset, "updated_by", userID);
    const dataset = await datasetService.createDraftDataset(draftDataset);
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: dataset });
}

const getDraftDataset = (datasetReq: Record<string, any>): Record<string, any> => {
    const transformationsConfig:Array<Record<string, any>> = _.get(datasetReq, "transformations_config")
    const connectorsConfig:Array<Record<string, any>> = _.get(datasetReq, "connectors_config")
    const dataset = _.omit(datasetReq, ["transformations_config", "connectors_config"])
    const mergedDataset = mergeDatasetConfigs(defaultDatasetConfig, dataset)
    const draftDataset = { 
        ...mergedDataset, 
        version_key: Date.now().toString(),
        transformations_config: getDatasetTransformations(transformationsConfig),
        connectors_config: getDatasetConnectors(connectorsConfig),
    }
    return draftDataset;
}

const mergeDatasetConfigs = (defaultConfig: Record<string, any>, requestPayload: Record<string, any>): Record<string, any> => {
    const { id, dataset_id } = requestPayload;
    const datasetId = !id ? dataset_id : id
    const modifyPayload = { ...requestPayload, id: datasetId, router_config: { topic: datasetId } }
    const defaults = _.cloneDeep(defaultConfig)
    const datasetConfigs = _.merge(defaults, modifyPayload)
    return datasetConfigs
}

const getDatasetConnectors = (connectorConfigs: Array<Record<string, any>>): Array<Record<string, any>> => {
    
    if (!_.isEmpty(connectorConfigs)) {
        const uniqueConnectors = _.uniqWith(connectorConfigs, (a: Record<string, any>, b: Record<string, any>) => {
            return _.isEqual(a.connector_id, b.connector_id) && _.isEqual(a.connector_config, b.connector_config)
        })
        return _.map(uniqueConnectors, (config) => {
            return {
                id: config.id,
                connector_id: config.connector_id,
                connector_config: cipherService.encrypt(JSON.stringify(config.connector_config)),
                operations_config: config.operations_config,
                version: config.version
            }
        })
    }
    return []
}

const getDatasetTransformations = (configs: Array<Record<string, any>>): Array<Record<string, any>> => {

    if (configs) {
        return _.uniqBy(configs, "field_key")
    }
    return []
}

export default datasetCreate;