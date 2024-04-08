import { Request, Response } from "express";
import { DatasetStatus } from "../../types/DatasetModels";
import _ from "lodash";
import { validDatasetFields } from "../../configs/DatasetConfigDefault";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { ErrorObject } from "../../types/ResponseModel";
import { query } from "../../connections/databaseConnection";
import logger from "../../logger";
import httpStatus from "http-status";

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
        const fieldValue = !_.isEmpty(fields) ? getFieldValues({ fields, status }) : "*"
        const { results } = await query(`SELECT ${fieldValue} FROM ${datasetModel} WHERE id = '${dataset_id}'`)
        if (_.isEmpty(results)) {
            logger.error(`Dataset with the given dataset_id:${dataset_id} not found`)
            return ResponseHandler.errorResponse({
                message: "Dataset with the given dataset_id not found",
                statusCode: 404,
                errCode: "NOT_FOUND"
            } as ErrorObject, req, res);
        }

        logger.info(`Dataset Read Successfully with id:${dataset_id}`)
        const data = getResponseData(results);
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data });
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

const getFieldValues = (datasetFields: Record<string, any>) => {
    const { status, fields } = datasetFields;
    if (status == DatasetStatus.Live && _.includes(_.split(fields, ","), "version")) {
        return _.replace(fields, "version", "data_version")
    }
    return fields
}

const getResponseData = (data: Array<any>) => {
    const response = _.first(data);
    const liveDatasetVersion = _.get(response, "data_version")
    const updatedResponse = liveDatasetVersion ? { ..._.omit(response, ["data_version"]), version: liveDatasetVersion } : response
    return updatedResponse
}

export default datasetRead;