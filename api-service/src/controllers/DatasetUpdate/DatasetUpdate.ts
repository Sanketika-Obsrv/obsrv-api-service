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
import { getDraftTransformations } from "../../services/DatasetService";

export const apiId = "api.datasets.update";

const datasetUpdate = async (req: Request, res: Response) => {
    try {
        const datasetBody = req.body;
        const isRequestValid: Record<string, any> = schemaValidation(datasetBody, DatasetUpdate)
        if (!isRequestValid.isValid) {
            return ResponseHandler.errorResponse({
                message: isRequestValid.message,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const { dataset_id, ...rest } = datasetBody
        if (_.isEmpty(rest)) {
            logger.error(`Provide atleast one field in addition to the dataset_id:${dataset_id} to update the dataset`)
            return ResponseHandler.errorResponse({
                message: "Provide atleast one field in addition to the dataset_id to update the dataset",
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const { isDatasetExists, datasetStatus } = await checkDatasetExists(dataset_id);
        if (!isDatasetExists) {
            logger.error(`Dataset does not exists with id:${dataset_id}`)
            return ResponseHandler.errorResponse({
                message: "Dataset does not exists to update",
                statusCode: 404,
                errCode: "NOT_FOUND"
            } as ErrorObject, req, res);
        }

        if (isDatasetExists && datasetStatus != DatasetStatus.Draft) {
            logger.error(`Dataset with id:${dataset_id} cannot be updated as it is not in draft state`)
            return ResponseHandler.errorResponse({
                message: "Dataset cannot be updated as it is not in draft state",
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const duplicateDenormKeys = getDuplicateDenormKey(_.get(datasetBody, "denorm_config"))
        if (!_.isEmpty(duplicateDenormKeys)) {
            logger.error(`Duplicate denorm output fields found. Duplicate Denorm out fields are [${duplicateDenormKeys}]`)
            return ResponseHandler.errorResponse({
                statusCode: 400,
                message: `Dataset contains duplicate denorm out keys:[${duplicateDenormKeys}}]`,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const updatedDatasetConfigs = await getDatasetUpdatedConfigs(datasetBody);
        const datasetPayload = await mergeExistingDataset(updatedDatasetConfigs)

        const transformationConfigs = _.get(datasetBody, "transformation_config")
        await manageTransformations(transformationConfigs, dataset_id);

        await DatasetDraft.update(datasetPayload, { where: { id: dataset_id } })
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: "Dataset is updated successfully", id: dataset_id } });
    } catch (error: any) {
        logger.error(error)
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { message: "Failed to update dataset" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const manageTransformations = async (transformations: Record<string, any>, datasetId: string) => {
    if (transformations) {
        const transformationConfigs = await getTransformationConfigs(transformations, datasetId);
        if (transformationConfigs) {
            const { addTransformation, updateTransformation, deleteTransformation } = transformationConfigs;

            if (!_.isEmpty(addTransformation)) {
                await DatasetTransformationsDraft.bulkCreate(addTransformation);
            }

            if (!_.isEmpty(updateTransformation)) {
                await Promise.all(updateTransformation.map((record: any) => DatasetTransformationsDraft.update(record, { where: { id: record.id } })));
            }

            if (!_.isEmpty(deleteTransformation)) {
                await DatasetTransformationsDraft.destroy({ where: { id: deleteTransformation } });
            }
        }
    }
}

const checkDatasetExists = async (dataset_id: string): Promise<Record<string, any>> => {
    const datasetExists: Record<string, any> | null = await getExistingDataset(dataset_id)
    if (datasetExists) {
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
        denorm_config: denorm_config ? setDenormConfigs(denorm_config, _.get(existingDataset, ["denorm_config"])) : null
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
        logger.info(`Duplicate tags provided by user to add are [${duplicateTagsToAdd}]`)
    }

    const duplicateTagsToRemove: Array<string> = getDuplicateConfigs(tagsToRemove)
    if (!_.isEmpty(duplicateTagsToRemove)) {
        logger.info(`Duplicate tags provided by user to remove are [${duplicateTagsToRemove}]`)
    }

    const checkTagToAdd = _.intersection(datasetTags, _.uniq(tagsToAdd))
    if (_.size(checkTagToAdd)) {
        logger.error(`Dataset tags ${[checkTagToAdd]} already exists`)
        throw {
            message: "Dataset tags already exist",
            statusCode: 400,
            errCode: "BAD_REQUEST"
        } as ErrorObject
    }

    const checkTagToRemove = _.intersection(datasetTags, _.uniq(tagsToRemove))
    if (_.size(checkTagToRemove) !== _.size(_.uniq(tagsToRemove))) {
        logger.error(`Dataset tags ${[tagsToRemove]} does not exist to remove`)
        throw {
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
        logger.info(`Duplicate transformations provided by user are [${duplicateFieldKeys}]`)
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
        logger.error(`Dataset transformations ${[checkTransformationToAdd]} already exists`)
        throw {
            message: "Dataset transformations already exists",
            statusCode: 400,
            errCode: "BAD_REQUEST"
        } as ErrorObject
    }

    const transformationExistsToUpdate = _.every(transformationsToUpdate, payload => _.includes(checkTransformationToUpdate, payload.field_key))
    if (!transformationExistsToUpdate) {
        logger.error(`Dataset transformations ${[transformationsToUpdate]} does not exist to update`)
        throw {
            message: "Dataset transformations do not exist to update",
            statusCode: 404,
            errCode: "NOT_FOUND"
        } as ErrorObject
    }

    const isTransformationExistsToRemove = _.every(transformationsToRemove, payload => _.includes(checkTransformationToRemove, payload.field_key))
    if (!isTransformationExistsToRemove) {
        logger.error(`Dataset transformations ${[transformationsToRemove]} does not exist to remove`)
        throw {
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
        logger.info(`Duplicate denorm out fields provided by user are [${duplicateFieldKeys}]`)
    }

    const checkDenormKeys = (denormKeys: Record<string, any>) => {
        return _.intersection(datasetDenormFieldsKeys, _.map(denormKeys, payload => _.get(payload, ["denorm_out_field"])))
    }
    const checkDenormsToAdd = checkDenormKeys(denormsToAdd)
    const checkDenormsToRemove = checkDenormKeys(denormsToRemove)

    if (_.size(checkDenormsToAdd)) {
        logger.error(`Denorm fields [${checkDenormsToAdd}] already exist`)
        throw {
            message: "Denorm fields already exist",
            statusCode: 400,
            errCode: "BAD_REQUEST"
        } as ErrorObject
    }

    const isDenormExists = _.every(denormsToRemove, payload => _.includes(checkDenormsToRemove, payload.denorm_out_field))
    if (!isDenormExists) {
        logger.error(`Denorm fields [${denormFieldsToRemove}] do not exist to remove`)
        throw {
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

const getDuplicateConfigs = (configs: Array<string | any>) => {
    return _.compact(_.filter(configs, (item: string, index: number) => _.indexOf(configs, item) !== index));
}

export default datasetUpdate;
