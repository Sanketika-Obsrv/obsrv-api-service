import { Request, Response } from "express";
import logger from "../../logger";
import { getDraftDatasetRecord, getDefaultValue } from "../../services/DatasetService";
import _ from "lodash";
import DatasetCreate from "./DatasetCreateValidationSchema.json";
import { schemaValidation } from "../../services/ValidationService";
import { DatasetDraft } from "../../models/DatasetDraft";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";

const Create = async (req: Request, res: Response) => {
    try {
        const datasetBody = req.body;
        schemaValidation(datasetBody, DatasetCreate)
        await checkDatasetExists(_.get(req, ["body", "dataset_id"]));
        const datasetPayload: any = await getDefaultValue(datasetBody);
        const response = await DatasetDraft.create(datasetPayload)
        logger.info("Dataset Record Created Successfully")
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { id: _.get(response, ["dataValues", "id"]) || "" } });
    } catch (error: any) {
        logger.error(error)
        ResponseHandler.errorResponse(error, req, res);
    }
}

const checkDatasetExists = async (dataset_id: string) => {
    const datasetExists = await getDraftDatasetRecord(dataset_id)
    if (datasetExists) {
        logger.error("Dataset Record Already exists")
        throw ({ message: "Dataset Record Already exists", statusCode: 409, errCode: "CONFLICT" });
    }
    return datasetExists;
}

export default Create;