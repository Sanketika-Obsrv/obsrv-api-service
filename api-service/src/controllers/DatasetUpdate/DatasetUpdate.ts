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

        const { isDatasetExists, datasetStatus } = await checkDatasetExists(_.get(datasetBody, "dataset_id"));
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

        const transformations = _.get(datasetBody, "transformation_config")
        const transformationConfigs: any = transformations ? await getTransformationConfigs(transformations) : null
        if (transformationConfigs) {
            await DatasetTransformationsDraft.bulkCreate(transformationConfigs)
        }

        await DatasetDraft.update(datasetPayload, { where: { dataset_id } })
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: "Dataset is updated successfully" } });
    } catch (error: any) {
        ResponseHandler.errorResponse(error, req, res);
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
    const validationConfigs = validation_config ? setValidationConfigs(validation_config) : null
    const extractionConfig = extraction_config ? setExtractionConfigs(extraction_config) : null
    const dedupConfig = dedup_config ? setDedupConfigs(dedup_config) : null
    const datasetTags = tags ? getUpdatedTags(tags, _.get(existingDataset, "tags")) : null
    const denormConfig = denorm_config ? setDenormConfigs(denorm_config, _.get(existingDataset, ["denorm_config"])) : null
    return { ...payload, ...(validationConfigs && { validation_config: validationConfigs }), ...(extractionConfig && { extraction_config: extractionConfig }), ...(dedupConfig && { dedup_config: dedupConfig }), ...(datasetTags && { tags: datasetTags }), ...(denormConfig && { denorm_config: denormConfig }) }
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
    const updatedTags = _.flatten(_.map(payload, tagField => {
        const { values, action } = tagField
        if (action == "remove") {
            const checkTagExist = _.intersection(datasetTags, values)
            if (_.size(checkTagExist) !== _.size(values)) {
                throw { message: "Tags does not exist" }
            }
            return _.difference(datasetTags, values) || []
        } else if (action == "add") {
            const checkTagExist = _.intersection(datasetTags, values)
            if (_.size(checkTagExist)) {
                throw { message: "Tags exists" }
            }
            return _.concat(datasetTags, values)
        }
    }))
    return _.flatten(_.uniq(updatedTags))
}

const getTransformationConfigs = async (payload: Record<string, any>): Promise<Record<string, any>> => {
    const { dataset_id } = payload;
    const datasetTransformations: any = await getDraftTransformations(dataset_id)
    let transformations = datasetTransformations
    const existingTransformations = _.map(transformations, config => config.field_key)
    _.map(payload, fields => {
        const { values, action } = fields
        const fieldKey = _.get(values, "field_key")
        const checkTransformationExists = _.includes(existingTransformations, fieldKey)
        if (action == "remove") {
            if (!checkTransformationExists) {
                throw { message: "transformation not exists" }
            }
            transformations = _.filter(transformations, fields => fields.field_key != fieldKey)
        } else if (action == "add") {
            if (checkTransformationExists) {
                throw { message: "transformation exists" }
            }
            transformations = _.concat(transformations, { ...values, id: `${dataset_id}.${fieldKey}` })
        } else if (action == "update") {
            if (!checkTransformationExists) {
                throw { message: "transformation not exists" }
            }
            const existingTransformations = _.filter(transformations, field => field.field_key == fieldKey)
            transformations = _.filter(transformations, field => field.field_key !== fieldKey)
            const updatedTransformations = _.merge(existingTransformations, values)
            transformations = _.flatten(_.concat(transformations, updatedTransformations))
        }
    })
    return transformations
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
                throw { message: "denorm not exists" }
            }
            denormFields = _.filter(denormFields, fields => fields.denorm_out_field != denormOutField)
        } else if (action == "add") {
            if (checkDenormExist) {
                throw { message: "denorm exists" }
            }
            denormFields = _.concat(denormFields, values)
        }
    })
    return { ...datasetDenormConfigs, denorm_fields: denormFields }
}

const mergeExistingDataset = async (configs: Record<string, any>): Promise<Record<string, any>> => {
    const existingDataset = await getDraftDataset(_.get(configs, "dataset_id"))
    const mergedData = _.mergeWith(existingDataset, configs, (objValue, srcValue) => {
        if (_.isArray(objValue) && _.isEmpty(srcValue)) {
            return [];
        }
    });
    return _.omit(mergedData, "transformation_config")
}

export const getDraftTransformations = async (dataset_id: string) => {
    return DatasetTransformationsDraft.findAll({ where: { dataset_id }, raw: true });
}

export default datasetUpdate;
