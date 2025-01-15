import { Request, Response } from "express";
import _ from "lodash";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { datasetService, validateStorageSupport } from "../../services/DatasetService";
import { schemaValidation } from "../../services/ValidationService";
import StatusTransitionSchema from "./RequestValidationSchema.json";
import ReadyToPublishSchema from "./ReadyToPublishSchema.json"
import httpStatus from "http-status";
import { DatasetStatus, DatasetType } from "../../types/DatasetModels";
import { executeCommand } from "../../connections/commandServiceConnection";
import { defaultDatasetConfig } from "../../configs/DatasetConfigDefault";
import { obsrvError } from "../../types/ObsrvError";

const invalidRequest = "DATASET_STATUS_TRANSITION_INVALID_INPUT"
const datasetNotFound = "DATASET_NOT_FOUND"

const allowedTransitions: Record<string, any> = {
    Delete: [DatasetStatus.Draft, DatasetStatus.ReadyToPublish],
    ReadyToPublish: [DatasetStatus.Draft],
    Live: [DatasetStatus.ReadyToPublish],
    Retire: [DatasetStatus.Live]
}
const liveDatasetActions = ["Retire"]

const validateRequest = (req: Request, datasetId: any) => {
    const isRequestValid: Record<string, any> = schemaValidation(req.body, StatusTransitionSchema)
    if (!isRequestValid.isValid) {
        throw obsrvError(datasetId, invalidRequest, isRequestValid.message, "BAD_REQUEST", 400)
    }
}

const validateDataset = (dataset: any, datasetId: any, action: string) => {

    if (_.isEmpty(dataset)) {
        throw obsrvError(datasetId, datasetNotFound, `Dataset not found for dataset: ${datasetId}`, "NOT_FOUND", 404)
    }

    if (dataset.api_version !== "v2" && _.includes(["ReadyToPublish", "Live"], action)) {
        throw obsrvError(datasetId, "DATASET_API_VERSION_MISMATCH", "Draft dataset api version is not v2. Perform a read api call with mode=edit to migrate the dataset", "BAD_REQUEST", 400)
    }

    if (!_.includes(allowedTransitions[action], dataset.status)) {
        throw obsrvError(datasetId, `DATASET_${_.toUpper(action)}_FAILURE`, `Transition failed for dataset: ${dataset.id} status:${dataset.status} with status transition to ${action}`, "CONFLICT", 409)
    }

    return true;
}


const datasetStatusTransition = async (req: Request, res: Response) => {

    const { dataset_id, status } = _.get(req.body, "request");
    validateRequest(req, dataset_id);

    const dataset: Record<string, any> = (_.includes(liveDatasetActions, status)) ? await datasetService.getDataset(dataset_id, ["id", "status", "type", "api_version", "name"], true) : await datasetService.getDraftDataset(dataset_id, ["id", "dataset_id", "status", "type", "api_version"])
    const userID = (req as any)?.userID;
    validateDataset(dataset, dataset_id, status);

    switch (status) {
        case "Delete":
            await deleteDataset(dataset);
            break;
        case "ReadyToPublish":
            await readyForPublish(dataset, userID);
            break;
        case "Live":
            await publishDataset(dataset, userID);
            break;
        case "Retire":
            await retireDataset(dataset, userID);
            break;
        default:
            throw obsrvError(dataset.id, "UNKNOWN_STATUS_TRANSITION", "Unknown status transition requested", "BAD_REQUEST", 400)
    }

    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: `Dataset status transition to ${status} successful`, dataset_id } });
}


// Delete a draft dataset
const deleteDataset = async (dataset: Record<string, any>) => {

    await datasetService.deleteDraftDataset(dataset)
    // TODO: Delete any sample files or schemas that are uploaded 
}


const readyForPublish = async (dataset: Record<string, any>, updated_by: any) => {

    const draftDataset: any = await datasetService.getDraftDataset(dataset.dataset_id)
    validateStorageSupport(draftDataset);
    let defaultConfigs: any = _.cloneDeep(defaultDatasetConfig)
    defaultConfigs = _.omit(defaultConfigs, ["router_config"])
    defaultConfigs = _.omit(defaultConfigs, "dedup_config.dedup_key");
    if (_.get(draftDataset, "dataset_config.keys_config")) {
        defaultConfigs = _.omit(defaultConfigs, "dataset_config.keys_config");
    }
    if (draftDataset?.type === "master") {
        defaultConfigs = _.omit(defaultConfigs, "dataset_config.keys_config.data_key");
        defaultConfigs = _.omit(defaultConfigs, "dataset_config.cache_config.redis_db");
    }
    _.set(draftDataset, "updated_by", updated_by);
    _.mergeWith(draftDataset, draftDataset, defaultConfigs, (objValue, srcValue, key) => {
        if (key === "created_by" || key === "updated_by") {
            if (objValue !== "SYSTEM") {
                return objValue;
            }
            return srcValue;
        }
        if (_.isBoolean(objValue) && _.isBoolean(srcValue)) {
            return objValue;
        }
    });

    const datasetValid: Record<string, any> = schemaValidation(draftDataset, ReadyToPublishSchema)
    if (!datasetValid.isValid) {
        throw {
            code: "DATASET_CONFIGS_INVALID",
            message: datasetValid.message,
            errCode: "BAD_REQUEST",
            statusCode: 400
        }
    }
    _.set(draftDataset, "status", DatasetStatus.ReadyToPublish)
    await datasetService.updateDraftDataset(draftDataset)
}

/**
 * Method to publish a dataset. Does the following:
 * 1. Validate if all the denorm datasets are valid, no cirular reference and are in Live status
 * 2. Update the redis host and db if the dataset is a master dataset
 * 3. Save the draft copy
 * 4. Generate the Druid and Hudi datasource configuration depending on the storage configured 
 * 
 * @param dataset 
 */
const publishDataset = async (dataset: Record<string, any>, userID: any) => {

    const draftDataset: Record<string, any> = await datasetService.getDraftDataset(dataset.dataset_id) as unknown as Record<string, any>
    validateStorageSupport(draftDataset);
    _.set(draftDataset, ["created_by"], userID);
    _.set(draftDataset, ["updated_by"], userID);
    await validateAndUpdateDenormConfig(draftDataset);
    await updateMasterDataConfig(draftDataset)
    await datasetService.publishDataset(draftDataset)
}

const validateAndUpdateDenormConfig = async (draftDataset: Record<string, any>) => {

    // 1. Check if there are denorm fields and dependent master datasets are published
    const denormConfig = _.get(draftDataset, "denorm_config")
    if (denormConfig && !_.isEmpty(denormConfig.denorm_fields)) {
        const datasetIds = _.map(denormConfig.denorm_fields, "dataset_id")
        if (_.includes(datasetIds, draftDataset.id)) {
            throw {
                code: "SELF_REFERENCING_MASTER_DATA",
                message: `The denorm master dataset is self-referencing itself`,
                errCode: "CONFLICT",
                statusCode: 409
            }
        }
        const masterDatasets = await datasetService.findDatasets({ id: datasetIds, type: "master" }, ["id", "status", "dataset_config", "api_version"])
        const masterDatasetsStatus = _.map(denormConfig.denorm_fields, (denormField) => {
            const md = _.find(masterDatasets, (master) => { return denormField.dataset_id === master.id })
            const datasetStatus: Record<string, any> = {
                dataset_id: denormField.dataset_id,
                exists: (md) ? true : false,
                isLive: (md) ? md.status === "Live" : false,
                status: (md) ? md.status : false
            }
            if (!_.isEmpty(md)) {
                if (md.api_version === "v2")
                    datasetStatus["denorm_field"] = _.merge(denormField, { redis_db: md.dataset_config.cache_config.redis_db });
                else
                    datasetStatus["denorm_field"] = _.merge(denormField, { redis_db: md.dataset_config.redis_db });
            }

            return datasetStatus;
        })
        const invalidMasters = _.filter(masterDatasetsStatus, { isLive: false })
        if (_.size(invalidMasters) > 0) {
            const invalidIds = _.map(invalidMasters, "dataset_id")
            throw {
                code: "DEPENDENT_MASTER_DATA_NOT_LIVE",
                message: `The datasets with id:${invalidIds} are not in published status`,
                errCode: "PRECONDITION_REQUIRED",
                statusCode: 428
            }
        }

        // 2. Populate redis db for denorm
        const defaults = _.cloneDeep(defaultDatasetConfig)
        draftDataset["denorm_config"] = {
            redis_db_host: defaults.denorm_config.redis_db_host,
            redis_db_port: defaults.denorm_config.redis_db_port,
            denorm_fields: _.map(masterDatasetsStatus, "denorm_field")
        }
    }
}

const updateMasterDataConfig = async (draftDataset: Record<string, any>) => {
    if (draftDataset.type === "master") {
        const datasetConfig = _.get(draftDataset, "dataset_config")
        const defaultConfigs = _.cloneDeep(defaultDatasetConfig);

        const defaultCacheConfig = _.get(defaultConfigs, "dataset_config.cache_config");
        const currentCacheConfig = _.get(datasetConfig, "cache_config");
        draftDataset.dataset_config = {
            ...datasetConfig, cache_config: {
                ...defaultCacheConfig, ..._.omit(currentCacheConfig, "redis_db"),
                redis_db: _.get(currentCacheConfig, "redis_db")
            }
        };
        if (draftDataset.dataset_config.cache_config.redis_db === 0) {
            const { results }: any = await datasetService.getNextRedisDBIndex()
            if (_.isEmpty(results)) {
                throw {
                    code: "REDIS_DB_INDEX_FETCH_FAILED",
                    message: `Unable to fetch the redis db index for the master data`,
                    errCode: "INTERNAL_SERVER_ERROR",
                    statusCode: 500
                }
            }
            const nextRedisDB = parseInt(_.get(results, "[0].nextval")) || 3;
            _.set(draftDataset, "dataset_config.cache_config.redis_db", nextRedisDB)
        }
    }
}

const retireDataset = async (dataset: Record<string, any>, updated_by: any) => {

    await canRetireIfMasterDataset(dataset);
    await datasetService.retireDataset(dataset, updated_by);
    await restartPipeline(dataset);
}


const canRetireIfMasterDataset = async (dataset: Record<string, any>) => {

    if (dataset.type === DatasetType.master) {

        const liveDatasets = await datasetService.findDatasets({ status: DatasetStatus.Live }, ["dataset_config", "dataset_id"]) || []
        const draftDatasets = await datasetService.findDraftDatasets({ status: [DatasetStatus.ReadyToPublish, DatasetStatus.Draft] }, ["denorm_config", "id", "status"]) || []
        const allDatasets = _.union(liveDatasets, draftDatasets)
        const extractDenormFields = _.map(allDatasets, function (depDataset) {
            return { dataset_id: _.get(depDataset, "id"), status: _.get(depDataset, "status"), denorm_datasets: _.map(_.get(depDataset, "denorm_config.denorm_fields"), "dataset_id") }
        })
        const deps = _.filter(extractDenormFields, function (depDS) { return _.includes(depDS.denorm_datasets, dataset.id) })
        if (_.size(deps) > 0) {

            const denormErrMsg = `Failed to retire dataset as it is in use. Please retire or delete dependent datasets before retiring this dataset`
            throw obsrvError(dataset.id, "DATASET_IN_USE", denormErrMsg, "BAD_REQUEST", 400, undefined, _.map(deps, function (o) { return _.omit(o, "denorm_datasets") }))
        }
    }
}

export const restartPipeline = async (dataset: Record<string, any>) => {
    return executeCommand(dataset.id, "RESTART_PIPELINE")
}

export default datasetStatusTransition;