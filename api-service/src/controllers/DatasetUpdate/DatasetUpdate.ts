import { Request, Response } from "express";
import httpStatus from "http-status";
import _ from "lodash";
import Model from "sequelize/types/model";
import { DatasetStatus } from "../../types/DatasetModels";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { cipherService } from "../../services/CipherService";
import { datasetService, validateStorageSupport } from "../../services/DatasetService";
import { schemaValidation } from "../../services/ValidationService";
import DatasetUpdate from "./DatasetUpdateValidationSchema.json";
import { obsrvError } from "../../types/ObsrvError";
import logger from "../../logger";

export const apiId = "api.datasets.update";
export const invalidInputErrCode = "DATASET_UPDATE_INPUT_INVALID"
export const errorCode = "DATASET_UPDATE_FAILURE"

const validateRequest = async (req: Request) => {

    const datasetId = _.get(req, ["body", "request", "dataset_id"])
    const isRequestValid: Record<string, any> = schemaValidation(req.body, DatasetUpdate)
    if (!isRequestValid.isValid) {
        throw obsrvError(datasetId, "DATASET_UPDATE_INPUT_INVALID", isRequestValid.message, "BAD_REQUEST", 400)
    }

    const datasetBody = req.body.request
    const { dataset_id, version_key, ...rest } = datasetBody
    if (_.isEmpty(rest)) {
        logger.error({ apiId, message: `Provide atleast one field in addition to the dataset_id:${dataset_id} and version_key:${version_key} to update the dataset` })
        throw obsrvError(datasetId, "DATASET_UPDATE_NO_FIELDS", "Provide atleast one field in addition to the dataset_id to update the dataset", "BAD_REQUEST", 400)
    }

    validateStorageSupport(_.get(req, ["body", "request"]))
}

const validateDataset = (dataset: Record<string, any> | null, req: Request) => {

    const datasetId = _.get(req, ["body", "request", "dataset_id"])
    const versionKey = _.get(req, ["body", "request", "version_key"])
    if (dataset) {
        if (dataset.api_version !== "v2") {
            throw obsrvError(datasetId, "DATASET_API_VERSION_MISMATCH", "Draft dataset api version is not v2. Perform a read api call with mode=edit to migrate the dataset", "NOT_FOUND", 404)
        }
        if (dataset.version_key !== versionKey) {
            throw obsrvError(datasetId, "DATASET_OUTDATED", "The dataset is outdated. Please try to fetch latest changes of the dataset and perform the updates", "CONFLICT", 409)
        }
        if (!_.includes([DatasetStatus.Draft, DatasetStatus.ReadyToPublish], dataset.status)) {
            throw obsrvError(datasetId, "DATASET_NOT_IN_DRAFT_STATE_TO_UPDATE", "Dataset cannot be updated as it is not in draft state", "BAD_REQUEST", 400)
        }
    } else {
        throw obsrvError(datasetId, "DATASET_NOT_EXISTS", `Dataset does not exists with id:${datasetId}`, "NOT_FOUND", 404)
    }
}

const datasetUpdate = async (req: Request, res: Response) => {

    await validateRequest(req)
    const datasetReq = req.body.request;
    const datasetModel = await datasetService.getDraftDataset(datasetReq.dataset_id)
    validateDataset(datasetModel, req)

    const draftDataset = mergeDraftDataset(datasetModel, datasetReq);
    const userID = (req as any)?.userID;
    _.set(draftDataset, "updated_by", userID)
    const response = await datasetService.updateDraftDataset(draftDataset);
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: response });
}

const mergeDraftDataset = (datasetModel: Model<any, any> | null, datasetReq: any): Record<string, any> => {

    const prev_dataset_config = _.get(datasetModel, ["dataset_config"])
    const currentSchema = _.get(datasetModel, 'data_schema')
    const fieldsRemoved = (datasetReq.data_schema) ? getMissingFieldsInNewSchema(datasetReq.data_schema, currentSchema) : []
    const dataset: Record<string, any> = {
        version_key: Date.now().toString(),
        name: datasetReq.name || _.get(datasetModel, ["name"]),
        id: _.get(datasetModel, ["id"])
    }
    if (datasetReq.validation_config) dataset["validation_config"] = datasetReq.validation_config
    if (datasetReq.extraction_config) dataset["extraction_config"] = datasetReq.extraction_config
    if (datasetReq.dedup_config) dataset["dedup_config"] = datasetReq.dedup_config
    if (datasetReq.data_schema) dataset["data_schema"] = datasetReq.data_schema
    if (datasetReq.dataset_config) dataset["dataset_config"] = { ...prev_dataset_config, ...datasetReq.dataset_config }
    if (datasetReq.transformations_config || fieldsRemoved.length > 0)
        dataset["transformations_config"] = mergeTransformationsConfig(_.get(datasetModel, ["transformations_config"]), datasetReq.transformations_config, fieldsRemoved)
    if (datasetReq.denorm_config || fieldsRemoved.length > 0) dataset["denorm_config"] = mergeDenormConfig(_.get(datasetModel, ["denorm_config"]), datasetReq.denorm_config, fieldsRemoved)
    if (datasetReq.connectors_config) dataset["connectors_config"] = mergeConnectorsConfig(_.get(datasetModel, ["connectors_config"]), datasetReq.connectors_config)
    if (datasetReq.tags) dataset["tags"] = mergeTags(_.get(datasetModel, ["tags"]), datasetReq.tags)
    if (datasetReq.sample_data) dataset["sample_data"] = datasetReq.sample_data
    if (datasetReq.type) dataset["type"] = datasetReq.type
    if (fieldsRemoved.length > 0) {
        const keys_config = _.get(dataset["dataset_config"] ? dataset["dataset_config"] : prev_dataset_config, ["keys_config"])
        let modified = false;
        if (_.includes(fieldsRemoved, keys_config['data_key'])) {
            modified = true;
            keys_config['data_key'] = '';
        }
        if (_.includes(fieldsRemoved, keys_config['partition_key'])) {
            modified = true;
            keys_config['partition_key'] = '';
        }
        if (_.includes(fieldsRemoved, keys_config['timestamp_key'])) {
            modified = true;
            keys_config['timestamp_key'] = '';
        }
        if (modified) {
            if (dataset["dataset_config"]) {
                _.set(dataset["dataset_config"], 'keys_config', keys_config)
            } else {
                const keys_config = _.get(prev_dataset_config, ["keys_config"])
                dataset["dataset_config"] = { ...prev_dataset_config }
                _.set(dataset["dataset_config"], 'keys_config', keys_config)
            }
        }
    }
    return dataset;
}

const getMissingFieldsInNewSchema = (newSchema: any, oldSchema: any) => {

    const getRemovedPropertiesFieldsNested = (oldProperties: Record<string, any>, newProperties: Record<string, any>, path: string[] = []): string[] => {
        let removedFields: string[] = [];
        for (const key in oldProperties) {
            const fullPath = [...path, key].join('.');
            if (!(key in newProperties)) {
                removedFields.push(fullPath);
                if (typeof oldProperties[key] === 'object' && oldProperties[key].properties) {
                    removedFields = removedFields.concat(getRemovedPropertiesFieldsNested(oldProperties[key].properties || {}, {}, [...path, key]));
                }
            }
            else if (typeof oldProperties[key] === 'object' && typeof newProperties[key] === 'object') {
                removedFields = removedFields.concat(
                    getRemovedPropertiesFieldsNested(
                        oldProperties[key].properties || {},
                        newProperties[key].properties || {},
                        [...path, key]
                    )
                );
            }
        }
        return removedFields;
    };


    const getRemovedPropertiesFields = (oldSchema: any, newSchema: any): string[] => {
        const oldProperties = oldSchema.properties || {};
        const newProperties = newSchema.properties || {};
        return getRemovedPropertiesFieldsNested(oldProperties, newProperties);
    }

    // Example usage
    const removedFieldsNested = getRemovedPropertiesFields(oldSchema, newSchema);
    return removedFieldsNested
}

const mergeTransformationsConfig = (currentConfigs: any, newConfigs: any, fieldsRemoved: string[]) => {

    let updatedConfigs = currentConfigs;
    if (newConfigs && newConfigs.length) {
        const removeConfigs = _.map(_.filter(newConfigs, { action: "remove" }), "value.field_key")
        const addConfigs = _.map(_.filter(newConfigs, { action: "upsert" }), "value")

        updatedConfigs = _.unionWith(
            addConfigs,
            _.reject(currentConfigs, (config) => { return _.includes(removeConfigs, config.field_key) }),
            (a, b) => {
                return a.field_key === b.field_key
            }
        )
    }
    if (fieldsRemoved.length > 0) {
        updatedConfigs = _.reject(updatedConfigs, (config) => { return _.includes(fieldsRemoved, config.field_key) })
    }
    return updatedConfigs
}

const mergeDenormConfig = (currentConfig: any, newConfig: any, fieldsRemoved: string[]) => {

    let updatedConfigs = currentConfig.denorm_fields;
    if (_.get(newConfig, "denorm_fields")) {
        const removeConfigs = _.map(_.filter(newConfig.denorm_fields, { action: "remove" }), "value.denorm_out_field")
        const addConfigs = _.map(_.filter(newConfig.denorm_fields, { action: "upsert" }), "value")

        updatedConfigs = _.unionWith(
            addConfigs,
            _.reject(currentConfig.denorm_fields, (config) => { return _.includes(removeConfigs, config.denorm_out_field) }),
            (a, b) => {
                return a.denorm_out_field === b.denorm_out_field
            }
        )
    }
    if (fieldsRemoved.length > 0) {
        updatedConfigs = _.reject(updatedConfigs, (config) => { return _.includes(fieldsRemoved, config.denorm_key) })
    }
    return {
        denorm_fields: updatedConfigs
    }
}

const mergeConnectorsConfig = (currConfigs: any, newConfigs: any) => {

    const removeConfigs = _.map(_.filter(newConfigs, { action: "remove" }), "value.connector_id")
    const addConfigs = _.map(_.filter(newConfigs, { action: "upsert" }), "value")

    return _.unionWith(
        _.map(addConfigs, (config) => {
            return {
                id: config.id,
                connector_id: config.connector_id,
                connector_config: cipherService.encrypt(JSON.stringify(config.connector_config)),
                operations_config: config.operations_config,
                version: config.version
            }
        }),
        _.reject(currConfigs, (config) => { return _.includes(removeConfigs, config.connector_id) }),
        (a, b) => {
            return a.connector_id === b.connector_id
        }
    )
}

const mergeTags = (currentTags: any, newConfigs: any) => {

    const tagsToRemove = _.map(_.filter(newConfigs, { action: "remove" }), "value")
    const tagsToAdd = _.map(_.filter(newConfigs, { action: "upsert" }), "value")
    return _.union(_.pullAll(currentTags, tagsToRemove), tagsToAdd)
}

export default datasetUpdate;