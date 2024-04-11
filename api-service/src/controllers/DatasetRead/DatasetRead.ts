import { Request, Response } from "express";
import { DatasetStatus } from "../../types/DatasetModels";
import _ from "lodash";
import { validDatasetFields } from "../../configs/DatasetConfigDefault";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { ErrorObject } from "../../types/ResponseModel";
import { query } from "../../connections/databaseConnection";
import logger from "../../logger";
import httpStatus from "http-status";
import { DatasetTransformationsDraft } from "../../models/TransformationDraft";
import { DatasetTransformations } from "../../models/Transformation";

export const apiId = "api.datasets.read";

const datasetRead = async (req: Request, res: Response) => {
    try {
        const { dataset_id } = req.params;
        const { fields, status = DatasetStatus.Live } = req.query;

        const invalidFields = !_.isEmpty(fields) ? getInvalidFields({ datasetFields: fields }) : []
        if (!_.isEmpty(invalidFields)) {
            logger.error(`The specified fields [${invalidFields}] in the dataset cannot be found`)
            return ResponseHandler.errorResponse({
                message: `The specified fields [${invalidFields}] in the dataset cannot be found.`,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const datasetModel = getDatasetModel(status);
        const fieldValue = !_.isEmpty(fields) ? transformFieldValues({ fields, status }) : "*"
        let data: any = {}
        if (!_.isEmpty(fieldValue)) {
            const { results } = await query(`SELECT ${fieldValue} FROM ${datasetModel} WHERE id = '${dataset_id}'`)
            if (_.isEmpty(results)) {
                logger.error(`Dataset with the given dataset_id:${dataset_id} not found`)
                return ResponseHandler.errorResponse({
                    message: "Dataset with the given dataset_id not found",
                    statusCode: 404,
                    errCode: "NOT_FOUND"
                } as ErrorObject, req, res);
            }
            data = _.first(results)
        }
        logger.info(`Dataset Read Successfully with id:${dataset_id}`)
        const responseData = await transformResponseData({ status, dataset_id, data, fields });
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: responseData });
    } catch (error: any) {
        logger.error(error)
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { message: "Failed to read dataset" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const getDatasetModel = (status: string | any): string => {
    if (status === DatasetStatus.Draft || status === DatasetStatus.Publish) {
        return "datasets_draft";
    }
    return "datasets";
}

const getInvalidFields = (payload: Record<string, any>): Record<string, any> => {
    const { datasetFields } = payload
    const invalidFields = _.difference(_.split(datasetFields, ","), validDatasetFields)
    return invalidFields;
}

const transformFieldValues = (datasetFields: Record<string, any>) => {
    const { status, fields } = datasetFields;
    const updatedFields = _.join(_.remove(_.split(fields, ","), (newField) => newField !== "transformation_config"))
    if (!(status === DatasetStatus.Draft || status === DatasetStatus.Publish) && _.includes(fields, "version")) {
        return _.replace(updatedFields, "version", "data_version")
    }
    return updatedFields;
}

const transformResponseData = async (payload: Record<string, any>) => {
    const { data, dataset_id, status, fields } = payload
    const isTransformationConfig = _.includes(_.split(fields, ","), "transformation_config")
    if (isTransformationConfig || _.isEmpty(fields)) {
        const transformationModel = getTransfomationModel(status)
        const transformations = await transformationModel.findAll({ where: { dataset_id } })
        _.set(data, "transformation_config", transformations)
    }
    const liveDatasetVersion = _.get(data, "data_version")
    const updatedResponse = liveDatasetVersion ? { ..._.omit(data, ["data_version"]), version: liveDatasetVersion } : data
    return updatedResponse
}

const getTransfomationModel = (status: string) => {
    if (status === DatasetStatus.Draft || status === DatasetStatus.Publish) {
        return DatasetTransformationsDraft
    }
    return DatasetTransformations
}

export default datasetRead;