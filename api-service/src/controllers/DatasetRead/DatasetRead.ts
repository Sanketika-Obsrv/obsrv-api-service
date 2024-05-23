import { Request, Response } from "express";
import { DatasetStatus } from "../../types/DatasetModels";
import _ from "lodash";
import { validDatasetFields } from "../../configs/DatasetConfigDefault";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { ErrorObject } from "../../types/ResponseModel";
import logger from "../../logger";
import httpStatus from "http-status";
import { DatasetTransformationsDraft } from "../../models/TransformationDraft";
import { DatasetTransformations } from "../../models/Transformation";
import { DatasetDraft } from "../../models/DatasetDraft";
import { Dataset } from "../../models/Dataset";
import { setReqDatasetId } from "../../services/DatasetService";

export const apiId = "api.datasets.read";
export const errorCode = "DATASET_READ_FAILURE"

const datasetRead = async (req: Request, res: Response) => {
    const { dataset_id } = req.params;
    const resmsgid = _.get(res, "resmsgid");
    try {
        const { fields, status = DatasetStatus.Live } = req.query;

        setReqDatasetId(req, dataset_id)

        const invalidFields = !_.isEmpty(fields) ? getInvalidFields({ datasetFields: fields, status }) : []
        if (!_.isEmpty(invalidFields)) {
            const code = "DATASET_INVALID_FIELDS"
            logger.error({ code, apiId, dataset_id, resmsgid, message: `The specified fields [${invalidFields}] in the dataset cannot be found` })
            return ResponseHandler.errorResponse({
                code,
                message: `The specified fields [${invalidFields}] in the dataset cannot be found.`,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const datasetModel = getDatasetModel(status);
        const fieldValue = !_.isEmpty(fields) ? transformFieldValues({ fields, status }) : "*"
        let data: any = {}
        if (!_.isEmpty(fieldValue)) {
            const results = await datasetModel.findAll({ where: { id: dataset_id }, ...(fieldValue !== "*" && { attributes: fieldValue }), raw: true })
            if (_.isEmpty(results)) {
                const code = "DATASET_NOT_FOUND"
                logger.error({ code, apiId, dataset_id, resmsgid, message: `Dataset with the given dataset_id:${dataset_id} not found` })
                return ResponseHandler.errorResponse({
                    code,
                    message: "Dataset with the given dataset_id not found",
                    statusCode: 404,
                    errCode: "NOT_FOUND"
                } as ErrorObject, req, res);
            }
            data = _.first(results)
        }

        const responseData = await transformResponseData({ status, dataset_id, data, fields });
        logger.info({ apiId, resmsgid, message: `Dataset Read Successfully with id:${dataset_id}`, response: responseData })
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: responseData });
    } catch (error: any) {
        const code = _.get(error, "code") || errorCode
        logger.error({ ...error, apiId, code, dataset_id, resmsgid })
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code, message: "Failed to read dataset" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const getDatasetModel = (status: string | any) => {
    if (status === DatasetStatus.Draft || status === DatasetStatus.Publish) {
        return DatasetDraft;
    }
    return Dataset;
}

const getInvalidFields = (payload: Record<string, any>): Record<string, any> => {
    const { datasetFields, status } = payload
    const fieldValues = _.split(datasetFields, ",")
    if (!(status == DatasetStatus.Draft || status == DatasetStatus.Publish)) {
        validDatasetFields.splice(_.indexOf(validDatasetFields, "version_key", 1))
        return _.difference(fieldValues, validDatasetFields)
    }
    const invalidFields = _.difference(fieldValues, validDatasetFields)
    return invalidFields;
}

const transformFieldValues = (datasetFields: Record<string, any>) => {
    const { status, fields } = datasetFields;
    const updatedFields = _.remove(_.split(fields, ","), (newField) => newField !== "transformations_config")
    if (!(status === DatasetStatus.Draft || status === DatasetStatus.Publish) && _.includes(updatedFields, "version")) {
        const fieldIndex = _.indexOf(updatedFields, "version")
        updatedFields[fieldIndex] = "data_version"
    }
    return updatedFields
}

const transformResponseData = async (payload: Record<string, any>) => {
    const { data, dataset_id, status, fields } = payload
    const transformationConfigExist = _.includes(_.split(fields, ","), "transformations_config")
    if (transformationConfigExist || _.isEmpty(fields)) {
        const transformationModel = getTransfomationModel(status)
        const transformations = await transformationModel.findAll({ where: { dataset_id }, raw: true, attributes: ["field_key", "transformation_function", "mode", "metadata"] })
        _.set(data, "transformations_config", transformations)
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