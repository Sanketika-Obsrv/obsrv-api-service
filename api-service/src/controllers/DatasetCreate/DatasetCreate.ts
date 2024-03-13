import { Request, Response } from "express";
import logger from "../../logger";
import { checkDatasetExists, getDefaultValue } from "../../services/DatasetService";
import _ from "lodash";
import DatasetCreate from "./DatasetCreateSchema.json";
import { schemaValidation } from "../../services";
import { DatasetDraft } from "../../models/DatasetDraft";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";

const Create = async (req: Request, res: Response) => {
    try {
        const alertBody = req.body;
        schemaValidation(alertBody, DatasetCreate)
        await checkDatasetExists(_.get(req, ["body", "dataset_id"]));
        const alertPayload: any = getDefaultValue(alertBody);
        const response = await DatasetDraft.create(alertPayload, { raw: true })
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { id: _.get(response, ["dataValues", "id"]) } });
    } catch (error: any) {
        logger.error(error)
        ResponseHandler.errorResponse(error, req, res);
    }
}

export default Create;