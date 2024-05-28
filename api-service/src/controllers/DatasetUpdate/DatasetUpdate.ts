import httpStatus from "http-status";
import { Request, Response } from "express";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { schemaValidation } from "../../services/ValidationService";
import DatasetUpdate from "./DatasetUpdateValidationSchema.json";
import _ from "lodash";
import { DatasetStatus } from "../../types/DatasetModels";
import { ErrorObject } from "../../types/ResponseModel";
import { DatasetDraft } from "../../models/DatasetDraft";
import logger from "../../logger";
import { defaultDatasetConfig } from "../../configs/DatasetConfigDefault";
import { DatasetTransformationsDraft } from "../../models/TransformationDraft";
import { generateDataSource, getDraftTransformations, getDuplicateConfigs, setReqDatasetId } from "../../services/DatasetService";
import { sequelize } from "../../connections/databaseConnection";
import { DatasourceDraft } from "../../models/DatasourceDraft";

export const apiId = "api.datasets.update";
export const invalidInputErrCode = "DATASET_UPDATE_INPUT_INVALID"
export const errorCode = "DATASET_UPDATE_FAILURE"

const datasetUpdate = async (req: Request, res: Response) => {
    const requestBody = req.body
    const msgid = _.get(req, ["body", "params", "msgid"]);
    const resmsgid = _.get(res, "resmsgid");
    const transact = await sequelize.transaction();
    try {
        const datasetId = _.get(req, ["body", "request", "dataset_id"])
        setReqDatasetId(req, datasetId)

        const isRequestValid: Record<string, any> = schemaValidation(req.body, DatasetUpdate)
        if (!isRequestValid.isValid) {
            logger.error({ code: invalidInputErrCode, apiId, msgid, requestBody, resmsgid, message: isRequestValid.message })
            return ResponseHandler.errorResponse({
                code: invalidInputErrCode,
                message: isRequestValid.message,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const datasetBody = req.body.request
        const { dataset_id, version_key, ...rest } = datasetBody
        if (_.isEmpty(rest)) {
            const code = "DATASET_UPDATE_NO_FIELDS"
            logger.error({ code, apiId, msgid, requestBody, resmsgid, message: `Provide atleast one field in addition to the dataset_id:${dataset_id} and version_key:${version_key} to update the dataset` })
            return ResponseHandler.errorResponse({
                code,
                message: "Provide atleast one field in addition to the dataset_id to update the dataset",
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const { isDatasetExists, datasetStatus, invalidVersionKey, validVersionKey } = await checkDatasetExists(dataset_id, version_key);
        if (!isDatasetExists) {
            const code = "DATASET_NOT_EXISTS"
            logger.error({ code, apiId, msgid, requestBody, resmsgid, message: `Dataset does not exists with id:${dataset_id}` })
            return ResponseHandler.errorResponse({
                code,
                message: "Dataset does not exists to update",
                statusCode: 404,
                errCode: "NOT_FOUND"
            } as ErrorObject, req, res);
        }

        if (isDatasetExists && datasetStatus != DatasetStatus.Draft) {
            const code = "DATASET_NOT_IN_DRAFT_STATE_TO_UPDATE"
            logger.error({ code, apiId, msgid, requestBody, resmsgid, message: `Dataset with id:${dataset_id} cannot be updated as it is not in draft state` })
            return ResponseHandler.errorResponse({
                code,
                message: "Dataset cannot be updated as it is not in draft state",
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        if (invalidVersionKey) {
            const code = "DATASET_OUTDATED"
            logger.error({ code, apiId, msgid, requestBody, resmsgid, message: `The dataset:${dataset_id} with version_key:${version_key} is outdated. Please try to fetch latest changes of the dataset with version key:${validVersionKey} and perform the updates` })
            return ResponseHandler.errorResponse({
                code,
                message: "The dataset is outdated. Please try to fetch latest changes of the dataset and perform the updates",
                statusCode: 409,
                errCode: "CONFLICT"
            } as ErrorObject, req, res);
        }

        const duplicateDenormKeys = getDuplicateDenormKey(_.get(datasetBody, "denorm_config"))
        if (!_.isEmpty(duplicateDenormKeys)) {
            const code = "DATASET_DUPLICATE_DENORM_KEY"
            logger.error({ code, apiId, msgid, requestBody, resmsgid, message: `Duplicate denorm output fields found. Duplicate Denorm out fields are [${duplicateDenormKeys}]` })
            return ResponseHandler.errorResponse({
                code,
                statusCode: 400,
                message: `Dataset contains duplicate denorm out keys:[${duplicateDenormKeys}]`,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const updatedDatasetConfigs = await getDatasetUpdatedConfigs(datasetBody);
        const datasetPayload = await mergeExistingDataset(updatedDatasetConfigs)

        const transformationConfigs = _.get(datasetBody, "transformation_config")
        await manageTransformations(transformationConfigs, dataset_id, transact);

        const { data_schema } = datasetBody
        if (data_schema) {
            const { dataset_config, id, dataset_id } = datasetPayload
            const datasourcePayload = generateDataSource({ indexCol: _.get(dataset_config, ["timestamp_key"]), data_schema, id, dataset_id })
            await DatasourceDraft.update(datasourcePayload, { where: { id: _.get(datasourcePayload, "id") }, transaction: transact })
        }

        await DatasetDraft.update(datasetPayload, { where: { id: dataset_id }, transaction: transact })

        await transact.commit();
        const responsedata = { message: "Dataset is updated successfully", id: dataset_id, version_key: _.get(datasetPayload, "version_key") }
        logger.info({ apiId, msgid, requestBody, resmsgid, message: `Dataset updated successfully with id:${dataset_id}`, response: responsedata })
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: responsedata });
    } catch (error: any) {
        await transact.rollback();
        const code = _.get(error, "code") || errorCode
        logger.error({ ...error, apiId, code, msgid, requestBody, resmsgid })
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code, message: "Failed to update dataset" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const manageTransformations = async (transformations: Record<string, any>, datasetId: string, transact: any) => {
    if (transformations) {
        const transformationConfigs = await getTransformationConfigs(transformations, datasetId);
        if (transformationConfigs) {
            const { addTransformation, updateTransformation, deleteTransformation } = transformationConfigs;

            if (!_.isEmpty(addTransformation)) {
                await DatasetTransformationsDraft.bulkCreate(addTransformation, { transaction: transact });
            }

            if (!_.isEmpty(updateTransformation)) {
                await Promise.all(updateTransformation.map((record: any) => DatasetTransformationsDraft.update(record, { where: { id: record.id }, transaction: transact })));
            }

            if (!_.isEmpty(deleteTransformation)) {
                await DatasetTransformationsDraft.destroy({ where: { id: deleteTransformation }, transaction: transact });
            }
        }
    }
}

const checkDatasetExists = async (dataset_id: string, version_key: string): Promise<Record<string, any>> => {
    const datasetExists: Record<string, any> | null = await getExistingDataset(dataset_id)
    if (datasetExists) {
        const validVersionKey = _.get(datasetExists, "version_key")
        if (validVersionKey !== version_key) {
            return { isDatasetExists: true, datasetStatus: datasetExists.status, invalidVersionKey: true, validVersionKey }
        }
        return { isDatasetExists: true, datasetStatus: datasetExists.status }
    } else {
        return { isDatasetExists: false, datasetStatus: "" }
    }
}

const getDatasetUpdatedConfigs = async (payload: Record<string, any>): Promise<Record<string, any>> => {
    const { validation_config, extraction_config, dedup_config, tags, denorm_config, dataset_id } = payload
    const existingDataset: any = await getExistingDataset(dataset_id)
    const updatedConfigs = {
        validation_config: validation_config ? setValidationConfigs(validation_config) : null,
        extraction_config: extraction_config ? setExtractionConfigs(extraction_config) : null,
        dedup_config: dedup_config ? setDedupConfigs(dedup_config) : null,
        tags: tags ? getUpdatedTags(tags, _.get(existingDataset, "tags")) : null,
        denorm_config: denorm_config ? setDenormConfigs(denorm_config, _.get(existingDataset, ["denorm_config"])) : null,
        version_key: Date.now().toString()
    }
    return _.pickBy({ ...payload, ...updatedConfigs }, _.identity)
}

const getDuplicateDenormKey = (denormConfig: Record<string, any>): Array<string> => {
    if (denormConfig && _.isArray(_.get(denormConfig, 'denorm_fields'))) {
        const denormFields = _.get(denormConfig, "denorm_fields")
        const denormOutKeys = _.compact(_.map(denormFields, field => _.get(field, "action") == "add" && _.get(field, "values.denorm_out_field")))
        const duplicateDenormKeys: Array<string> = _.filter(denormOutKeys, (item: string, index: number) => _.indexOf(denormOutKeys, item) !== index);
        return duplicateDenormKeys;
    }
    return []
}

const setValidationConfigs = (configs: Record<string, any>): Record<string, any> => {
    const validationStatus = _.get(configs, "validate")
    if (!validationStatus) {
        _.set(configs, "mode", defaultDatasetConfig.validation_config.mode)
    }
    return configs;
}

const setExtractionConfigs = (configs: Record<string, any>): Record<string, any> => {
    const isBatchEvent = _.get(configs, "is_batch_event")
    if (!isBatchEvent) {
        return _.merge(configs, defaultDatasetConfig.extraction_config)
    }
    return configs
}

const setDedupConfigs = (configs: Record<string, any>): Record<string, any> => {
    const dropDuplicates = _.get(configs, "drop_duplicates")
    if (!dropDuplicates) {
        return { ...defaultDatasetConfig.dedup_config, drop_duplicates: dropDuplicates }
    }
    return configs
}

const getUpdatedTags = (newTagsPayload: Record<string, any>, datasetTags: Array<string>): Record<string, any> => {

    const getTagsPayload = (action: string) => {
        return _.compact(_.flatten(_.map(newTagsPayload, fields => {
            if (fields.action == action) return _.map(fields.values, value => _.toLower(value))
        })))
    }
    const tagsToAdd = getTagsPayload("add")
    const tagsToRemove = getTagsPayload("remove")

    const duplicateTagsToAdd: Array<string> = getDuplicateConfigs(tagsToAdd)
    if (!_.isEmpty(duplicateTagsToAdd)) {
        logger.info({ apiId, message: `Duplicate tags provided by user to add are [${duplicateTagsToAdd}]` })
    }

    const duplicateTagsToRemove: Array<string> = getDuplicateConfigs(tagsToRemove)
    if (!_.isEmpty(duplicateTagsToRemove)) {
        logger.info({ apiId, message: `Duplicate tags provided by user to remove are [${duplicateTagsToRemove}]` })
    }

    const checkTagToAdd = _.intersection(datasetTags, _.uniq(tagsToAdd))
    if (_.size(checkTagToAdd)) {
        throw {
            code: "DATASET_TAGS_EXISTS",
            message: "Dataset tags already exist",
            statusCode: 400,
            errCode: "BAD_REQUEST"
        } as ErrorObject
    }

    const checkTagToRemove = _.intersection(datasetTags, _.uniq(tagsToRemove))
    if (_.size(checkTagToRemove) !== _.size(_.uniq(tagsToRemove))) {
        throw {
            code: "DATASET_TAGS_DO_NOT_EXIST",
            message: "Dataset tags do not exist to remove",
            statusCode: 404,
            errCode: "NOT_FOUND"
        } as ErrorObject
    }

    const tagsAfterAddition = _.concat(datasetTags, tagsToAdd)
    const updatedTags = _.difference(tagsAfterAddition, tagsToRemove)
    return _.flatten(updatedTags)
}

const getTransformationConfigs = async (newTransformationPayload: Record<string, any>, dataset_id: string): Promise<Record<string, any>> => {
    const datasetTransformations: any = await getDraftTransformations(dataset_id)
    let addTransformation: Record<string, any> = []
    let updateTransformation: Record<string, any> = []
    let deleteTransformation: Array<string> = []

    const existingTransformationsFields = _.map(datasetTransformations, config => config?.field_key)
    const transformationFieldKeys = _.flatten(_.map(newTransformationPayload, fields => {
        if (fields.action == "add") return fields.values.field_key
    }))

    const duplicateFieldKeys: Array<string> = getDuplicateConfigs(transformationFieldKeys)
    if (!_.isEmpty(duplicateFieldKeys)) {
        logger.info({ apiId, message: `Duplicate transformations provided by user are [${duplicateFieldKeys}]` })
    }

    const getTransformationPayload = (action: string) => {
        return _.compact(_.flatten(_.map(newTransformationPayload, payload => {
            if (payload.action == action) return payload.values
        })))
    }
    const transformationsToAdd = getTransformationPayload("add")
    const transformationsToUpdate = getTransformationPayload("update")
    const transformationsToRemove = getTransformationPayload("remove")

    const checkTransformations = (transformationPayload: Record<string, any>) => {
        return _.intersection(existingTransformationsFields, _.map(transformationPayload, payload => _.get(payload, ["field_key"])))
    }
    const checkTransformationToAdd = checkTransformations(transformationsToAdd)
    const checkTransformationToRemove = checkTransformations(transformationsToRemove)
    const checkTransformationToUpdate = checkTransformations(transformationsToUpdate)

    if (_.size(checkTransformationToAdd)) {
        throw {
            code: "DATASET_TRANSFORMATIONS_EXIST",
            message: "Dataset transformations already exists",
            statusCode: 400,
            errCode: "BAD_REQUEST"
        } as ErrorObject
    }

    const transformationExistsToUpdate = _.every(transformationsToUpdate, payload => _.includes(checkTransformationToUpdate, payload.field_key))
    if (!transformationExistsToUpdate) {
        throw {
            code: "DATASET_TRANSFORMATIONS_DO_NOT_EXIST",
            message: "Dataset transformations do not exist to update",
            statusCode: 404,
            errCode: "NOT_FOUND"
        } as ErrorObject
    }

    const isTransformationExistsToRemove = _.every(transformationsToRemove, payload => _.includes(checkTransformationToRemove, payload.field_key))
    if (!isTransformationExistsToRemove) {
        throw {
            code: "DATASET_TRANSFORMATIONS_DO_NOT_EXIST",
            message: "Dataset transformations do not exist to remove",
            statusCode: 404,
            errCode: "NOT_FOUND"
        } as ErrorObject
    }

    _.forEach(newTransformationPayload, fields => {
        const { values, action } = fields
        const fieldKey = _.get(values, "field_key")
        if (action == "remove") {
            const deleteFieldKey: string = `${dataset_id}_${fieldKey}`
            deleteTransformation = _.uniq(_.flatten(_.concat(deleteTransformation, deleteFieldKey)))
        }
        if (action == "add") {
            const transformationExists = _.some(addTransformation, field => field.field_key == fieldKey)
            if (!transformationExists) {
                addTransformation = _.flatten(_.concat(addTransformation, { ...values, id: `${dataset_id}_${fieldKey}`, dataset_id }))
            }
        }
        if (action == "update") {
            const existingTransformations = _.filter(datasetTransformations, transformationField => transformationField.field_key == fieldKey)
            const updatedTransformations = _.merge(_.get(existingTransformations, "[0]"), values)
            updateTransformation = _.flatten(_.concat(updateTransformation, updatedTransformations))
        }
    })
    return { addTransformation, deleteTransformation, updateTransformation }
}

const setDenormConfigs = (newDenormPayload: Record<string, any>, datasetDenormConfigs: Record<string, any>): Record<string, any> => {
    const datasetDenormFieldsKeys = _.map(_.get(datasetDenormConfigs, "denorm_fields"), fields => fields?.denorm_out_field)
    const { denorm_fields } = newDenormPayload;
    const existingDenormFields = _.get(datasetDenormConfigs, "denorm_fields") || []

    const getDenormPayload = (action: string) => {
        return _.compact(_.flatten(_.map(denorm_fields, payload => {
            if (payload.action == action) return payload.values
        })))
    }
    const denormsToAdd = getDenormPayload("add")
    const denormsToRemove = getDenormPayload("remove")

    const denormFieldsToRemove = _.map(denormsToRemove, field => field.denorm_out_field)
    const duplicateFieldKeys: Array<string> = getDuplicateConfigs(denormFieldsToRemove)
    if (!_.isEmpty(duplicateFieldKeys)) {
        logger.info({ apiId, message: `Duplicate denorm out fields provided by user are [${duplicateFieldKeys}]` })
    }

    const checkDenormKeys = (denormKeys: Record<string, any>) => {
        return _.intersection(datasetDenormFieldsKeys, _.map(denormKeys, payload => _.get(payload, ["denorm_out_field"])))
    }
    const checkDenormsToAdd = checkDenormKeys(denormsToAdd)
    const checkDenormsToRemove = checkDenormKeys(denormsToRemove)

    if (_.size(checkDenormsToAdd)) {
        throw {
            code: "DATASET_DENORM_EXISTS",
            message: "Denorm fields already exist",
            statusCode: 400,
            errCode: "BAD_REQUEST"
        } as ErrorObject
    }

    const isDenormExists = _.every(denormsToRemove, payload => _.includes(checkDenormsToRemove, payload.denorm_out_field))
    if (!isDenormExists) {
        throw {
            code: "DATASET_DENORM_DO_NOT_EXIST",
            message: "Denorm fields do not exist to remove",
            statusCode: 404,
            errCode: "NOT_FOUND"
        } as ErrorObject
    }

    const denormsFields = _.concat(existingDenormFields, denormsToAdd)
    const updatedDenormFields = _.filter(denormsFields, fields => !_.includes(checkDenormsToRemove, fields.denorm_out_field))
    return { ...datasetDenormConfigs, denorm_fields: updatedDenormFields }
}

const mergeExistingDataset = async (configs: Record<string, any>): Promise<Record<string, any>> => {
    const existingDataset = await getExistingDataset(_.get(configs, "dataset_id"))
    const mergedData = _.mergeWith(existingDataset, configs, (existingValue, newValue) => {
        if (_.isArray(existingValue) && _.isEmpty(newValue)) {
            return [];
        }
        if (_.isArray(existingValue) && !_.isEmpty(newValue)) {
            return newValue
        }
    });
    return _.omit(mergedData, ["dataset_id", "transformation_config", "created_date"])
}

export const getExistingDataset = async (id: string) => {
    return DatasetDraft.findOne({ where: { id }, raw: true })
}

export default datasetUpdate;
