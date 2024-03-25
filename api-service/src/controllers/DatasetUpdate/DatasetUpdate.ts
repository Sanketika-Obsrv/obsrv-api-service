import httpStatus from "http-status";
import { Request, Response } from "express";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { schemaValidation } from "../../services/ValidationService";
import DatasetUpdate from "./DatasetUpdateValidationSchema.json";
import { getDraftDataset } from "../../services/DatasetService";
import _ from "lodash";
import { DatasetStatus } from "../../types/DatasetModels";
import { ErrorObject } from "../../types/ResponseModel";
import { DatasetDraft } from "../../models/DatasetDraft";
import logger from "../../logger";
import { defaultDatasetConfig } from "../../configs/DatasetConfigDefault";
import { DatasetTransformationsDraft } from "../../models/TransformationDraft";
import moment from "moment";

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
            return ResponseHandler.errorResponse({
                message: "Invalid request body",
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const { isDatasetExists, datasetStatus } = await checkDatasetExists(dataset_id);
        if (!isDatasetExists) {
            return ResponseHandler.errorResponse({
                message: "Dataset does not exists",
                statusCode: 404,
                errCode: "NOT_FOUND"
            } as ErrorObject, req, res);
        }

        if (isDatasetExists && datasetStatus != DatasetStatus.Draft) {
            return ResponseHandler.errorResponse({
                message: "Given record is not a draft dataset",
                statusCode: 404,
                errCode: "NOT_FOUND"
            } as ErrorObject, req, res);
        }

        const duplicateDenormKeys = getDuplicateDenormKey(_.get(datasetBody, "denorm_config"))
        if (!_.isEmpty(duplicateDenormKeys)) {
            logger.error(`Duplicate denorm output fields found. Duplicate Denorm out fields are [${duplicateDenormKeys}]`)
            return ResponseHandler.errorResponse({
                statusCode: 400,
                message: "Duplicate denorm output fields found",
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const updatedConfigs = await getUpdatedConfigs(datasetBody);
        const datasetPayload = await mergeExistingDataset(updatedConfigs)

        const transformationConfigs = _.get(datasetBody, "transformation_config")
        await manageTransformations(transformationConfigs, dataset_id);

        await DatasetDraft.update(datasetPayload, { where: { dataset_id } })
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: "Dataset is updated successfully" } });
    } catch (error: any) {
        ResponseHandler.errorResponse(error, req, res);
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
    const datasetExists: Record<string, any> | null = await getDraftDataset(dataset_id)
    if (datasetExists) {
        return { isDatasetExists: true, datasetStatus: datasetExists.status }
    } else {
        return { isDatasetExists: false, datasetStatus: "" }
    }
}

const getUpdatedConfigs = async (payload: Record<string, any>): Promise<Record<string, any>> => {
    const { validation_config, extraction_config, dedup_config, tags, denorm_config, dataset_id } = payload
    const existingDataset: any = await getDraftDataset(dataset_id)
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

const getUpdatedTags = (payload: Record<string, any>, datasetTags: Array<string>): Record<string, any> => {
    let existingTags = datasetTags;
    const tagList = _.flatten(_.map(payload, fields => {
        if (fields.action == "add") return fields.values
    }))
    const duplicateTags: Array<string> = getDuplicateConfigs(tagList)
    if (!_.isEmpty(duplicateTags)) logger.info(`Duplicate tags provided by user to add are [${duplicateTags}]`)
    _.map(payload, tagField => {
        const { values, action } = tagField
        const checkTagExist = _.intersection(datasetTags, values)
        if (action == "remove") {
            if (_.size(checkTagExist) !== _.size(values)) {
                throw {
                    message: "Dataset tags do not exist to remove",
                    statusCode: 404,
                    errCode: "NOT_FOUND"
                } as ErrorObject
            }
            existingTags = _.difference(existingTags, values) || []
        } else if (action == "add") {
            if (_.size(checkTagExist)) {
                throw {
                    message: "Dataset tags already exist",
                    statusCode: 400,
                    errCode: "BAD_REQUEST"
                } as ErrorObject
            }
            existingTags = _.concat(existingTags, values)
        }
    })
    return _.uniq(_.flatten(existingTags))
}

const getTransformationConfigs = async (payload: Record<string, any>, dataset_id: string): Promise<Record<string, any>> => {
    const datasetTransformations: any = await getDraftTransformations(dataset_id)
    const transformations = datasetTransformations
    let addTransformation: Record<string, any> = []
    let updateTransformation: Record<string, any> = []
    let deleteTransformation: Array<string> = []
    const existingTransformations = _.map(transformations, config => config.field_key)
    const transformationListToAdd = _.flatten(_.map(payload, fields => {
        if (fields.action == "add") return fields.values.field_key
    }))
    const duplicateTags: Array<string> = getDuplicateConfigs(transformationListToAdd)
    if (!_.isEmpty(duplicateTags)) logger.info(`Duplicate tags provided by user are [${duplicateTags}]`)
    _.map(payload, fields => {
        const { values, action } = fields
        const fieldKey = _.get(values, "field_key")
        const checkTransformationExists = _.includes(existingTransformations, fieldKey)
        if (action == "remove") {
            if (!checkTransformationExists) {
                throw {
                    message: "Requested transformations do not exist to remove",
                    statusCode: 404,
                    errCode: "NOT_FOUND"
                } as ErrorObject
            }
            const deleteFieldKey: string = `${dataset_id}_${fieldKey}`
            deleteTransformation = _.uniq(_.flatten(_.concat(deleteTransformation, deleteFieldKey)))
        } else if (action == "add") {
            if (checkTransformationExists) {
                throw {
                    message: "Transformations already exists",
                    statusCode: 400,
                    errCode: "BAD_REQUEST"
                } as ErrorObject
            }
            const transformationExists = _.some(addTransformation, field => field.field_key == fieldKey)
            if (!transformationExists) {
                addTransformation = _.flatten(_.concat(addTransformation, { ...values, id: `${dataset_id}_${fieldKey}`, dataset_id }))
            }
        } else if (action == "update") {
            if (!checkTransformationExists) {
                throw {
                    message: "Requested transformations do not exist to update",
                    statusCode: 404,
                    errCode: "NOT_FOUND"
                } as ErrorObject
            }
            const existingTransformations = _.filter(transformations, transformationField => transformationField.field_key == fieldKey)
            const updatedTransformations = _.merge(_.get(existingTransformations, "[0]"), values)
            updateTransformation = _.flatten(_.concat(updateTransformation, updatedTransformations))
        }
    })
    return { addTransformation, deleteTransformation, updateTransformation }
}

const setDenormConfigs = (payload: Record<string, any>, datasetDenormConfigs: Record<string, any>): Record<string, any> => {
    const datasetDenormFields: Record<string, any> = _.get(datasetDenormConfigs, "denorm_fields")
    const { denorm_fields } = payload;
    let denormFields = datasetDenormFields
    const existingDenormKeys = _.map(denormFields, config => config.denorm_out_field)
    _.map(denorm_fields, fields => {
        const { values, action } = fields
        const denormOutField = _.get(values, "denorm_out_field")
        const checkDenormExist = _.includes(existingDenormKeys, denormOutField)
        if (action == "remove") {
            if (!checkDenormExist) {
                throw {
                    message: "Denorm fields do not exist to remove",
                    statusCode: 404,
                    errCode: "NOT_FOUND"
                } as ErrorObject
            }
            denormFields = _.filter(denormFields, fields => fields.denorm_out_field != denormOutField)
        } else if (action == "add") {
            if (checkDenormExist) {
                throw {
                    message: "Denorm fields already exist",
                    statusCode: 400,
                    errCode: "BAD_REQUEST"
                } as ErrorObject
            }
            denormFields = _.concat(denormFields, values)
        }
    })
    return { ...datasetDenormConfigs, denorm_fields: denormFields }
}

const mergeExistingDataset = async (configs: Record<string, any>): Promise<Record<string, any>> => {
    const existingDataset = await getDraftDataset(_.get(configs, "dataset_id"))
    const mergedData = _.mergeWith(existingDataset, _.omit(configs, ["dataset_id"]), (existingValue, newValue) => {
        if (_.isArray(existingValue) && _.isEmpty(newValue)) {
            return [];
        } else if (_.isArray(existingValue) && !_.isEmpty(newValue)) {
            return newValue
        }
    });
    const created_date = moment(_.get(mergedData, "created_date")).format()
    return _.omit({ ...mergedData, created_date }, ["transformation_config", "updated_date"])
}

export const getDraftTransformations = async (dataset_id: string) => {
    return DatasetTransformationsDraft.findAll({ where: { dataset_id }, raw: true });
}

const getDuplicateConfigs = (configs: Array<string | any>) => {
    return _.compact(_.filter(configs, (item: string, index: number) => _.indexOf(configs, item) !== index));
}

export default datasetUpdate;
