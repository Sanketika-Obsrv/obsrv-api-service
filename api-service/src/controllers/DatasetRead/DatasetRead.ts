import { Request, Response } from "express";
import { DatasetStatus } from "../../types/DatasetModels";
import _, { difference } from "lodash";
import { validDatasetFields, validDraftDatasetFields } from "../../configs/DatasetConfigDefault";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { ErrorObject } from "../../types/ResponseModel";
import { query } from "../../connections/databaseConnection";
import logger from "../../logger";
import httpStatus from "http-status";

const datasetRead = async (req: Request, res: Response) => {
    try {
        const { dataset_id } = req.params;
        const { fields, status = DatasetStatus.Live } = req.query;

        const invalidFields = getInvalidFields({ datasetFields: fields, status })
        if (!_.isEmpty(fields) && !_.isEmpty(invalidFields)) {
            logger.error(`The specified fields [${invalidFields}] in the dataset cannot be found`)
            return ResponseHandler.errorResponse({
                message: `The specified field [${invalidFields}] in the dataset cannot be found.`,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const datasetModel = getDatasetModel(status);
        const fieldValue = !_.isEmpty(fields) ? fields : "*"
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
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: _.get(results, "0") as any });
    } catch (error: any) {
        logger.error(error)
        ResponseHandler.errorResponse(error, req, res)
    }
}

const getDatasetModel = (status: string | any): string => {
    if (status === DatasetStatus.Draft || status === DatasetStatus.Publish) return "datasets_draft";
    return "datasets";
}

const getInvalidFields = (payload: Record<string, any>): Record<string, any> => {
    const { datasetFields, status } = payload
    if (status === DatasetStatus.Draft || status === DatasetStatus.Publish) {
        const invalidFields = _.difference(_.split(datasetFields, ","), validDraftDatasetFields)
        return invalidFields
    }
    const invalidFields = difference(_.split(datasetFields, ","), validDatasetFields)
    return invalidFields;
}

export default datasetRead;