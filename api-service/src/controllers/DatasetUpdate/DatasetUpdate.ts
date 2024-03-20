import httpStatus from "http-status";
import { Request, Response } from "express";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { schemaValidation } from "../../services/ValidationService";
import DatasetUpdate from "./DatasetUpdateValidationSchema.json";
import { getDraftDataset, getDuplicateDenormKey } from "../../services/DatasetService";
import _ from "lodash";
import { DatasetStatus } from "../../types/DatasetModels";

const datasetUpdate = async (req: Request, res: Response) => {
    try {
        const datasetBody = req.body;
        const isRequestValid: Record<string, any> = schemaValidation(datasetBody, DatasetUpdate)
        if (!isRequestValid.isValid) {
            //throw error
        }

        const { isDatasetExists, datasetStatus } = await checkDatasetExists(_.get(datasetBody, "dataset_id"));
        if (!isDatasetExists) {
            //throw error
        }

        if (isDatasetExists && datasetStatus != DatasetStatus.Draft) {
            //throw error
        }

        const duplicateDenormKeys = getDuplicateDenormKey(_.get(datasetBody, "denorm_config"))
        if (!_.isEmpty(duplicateDenormKeys)) {
            //throw error
        }

        const updatedConfigs = getUpdatedConfigs(datasetBody);
        const datasetPayload = await mergeExistingDataset(updatedConfigs)

        const transformations = _.get(datasetBody, "transformation_config")
        const transformationConfigs = transformations ? getTransformationConfigs(transformations) : null
        if (transformationConfigs) {
            //add the transformations in the dataset_transformations_draft table
        }

        //dataset payload is updated to datasets_draft table
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: "Dataset is updated successfully", id: datasetPayload.id } });
    } catch (error: any) {
        ResponseHandler.errorResponse(error, req, res);
    }
}

const checkDatasetExists = async (dataset_id: string): Promise<Record<string, any>> => {
    //checks dataset exists and returns an object of whether datasets exists and the dataset status
    const datasetExists: Record<string, any> | null = await getDraftDataset(dataset_id)
    if (datasetExists) {
        return { isDatasetExists: true, datasetStatus: datasetExists.status }
    } else {
        return { isDatasetExists: false, datasetStatus: "" }
    }
}

const getUpdatedConfigs = (payload: Record<string, any>): Record<string, any> => {
    //update payload based on actions and conditions and return
    const validationConfigs = _.get(payload, "validation_config") ? setValidationConfigs(payload) : null
    const extractionConfig = _.get(payload, "extraction_config") ? setExtractionConfigs(payload) : null
    const dedupConfig = _.get(payload, "dedup_config") ? setDedupConfigs(payload) : null
    const tags = _.get(payload, "tags") ? getUpdatedTags(payload) : null
    const denormConfig = _.get(payload, "dedup_config") ? setDenormConfigs(payload) : null
    return {}
}

const setValidationConfigs = (payload: Record<string, any>): Record<string, any> => {
    //ValidationConfigs are set
    return payload
}

const setExtractionConfigs = (payload: Record<string, any>): Record<string, any> => {
    //ExtractionConfigs are set
    return payload
}

const setDedupConfigs = (payload: Record<string, any>): Record<string, any> => {
    //DedupConfigs are set
    return payload
}

const getUpdatedTags = (payload: Record<string, any>): Record<string, any> => {
    //tags are set based on the actions
    return payload
}

const getTransformationConfigs = (payload: Record<string, any>): Record<string, any> => {
    //transformations are updated based on the actions
    return payload
}

const setDenormConfigs = (payload: Record<string, any>): Record<string, any> => {
    //denorm fields are updated based on the actions
    return payload
}

const mergeExistingDataset = async (configs: Record<string, any>): Promise<Record<string, any>> => {
    //gets the existing dataset and merge the given configs to the existing data
    return configs;
}

export default datasetUpdate;
