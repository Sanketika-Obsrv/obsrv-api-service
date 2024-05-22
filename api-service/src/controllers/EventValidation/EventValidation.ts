import { Request, Response } from "express";
import * as _ from "lodash"
import { schemaValidation } from "../../services/ValidationService";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import validationSchema from "./RequestValidationSchema.json"
import logger from "../../logger";
import { getDataset, getDraftDataset } from "../../services/DatasetService";
const apiId = "api.schema.validator";

export const eventValidation = async (req: Request, res: Response) => {
    const requestBody = req.body;
    try {
        const msgid = _.get(req, "body.params.msgid");
        const resmsgid = _.get(res, "resmsgid");
        const isValidSchema = schemaValidation(requestBody, validationSchema);
        const datasetId = _.get(req, "body.request.datasetId");
        const isLive = _.get(req, "body.request.isLive");
        const event = _.get(req, "body.request.event");
        let dataset: any;
        let schema: any;

        if (!isValidSchema?.isValid) {
            logger.error({ apiId, msgid, resmsgid, requestBody, message: isValidSchema?.message, code: "SCHEMA_VALIDATOR_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST", code: "SCHEMA_VALIDATOR_INVALID_INPUT" }, req, res);
        }

        if (isLive) {
            dataset = await getDataset(datasetId, true);
            schema = _.get(dataset, "data_schema")
        }

        if (!isLive) {
            dataset = await getDraftDataset(datasetId);
            schema = _.get(dataset, "data_schema")
        }

        if (dataset === null) {
            logger.error({ apiId, resmsgid, requestBody, message: `Dataset ${datasetId} does not exists`, code: "DATASET_NOT_EXISTS" })
            return ResponseHandler.errorResponse({ message: `Dataset ${datasetId} does not exists`, statusCode: 404, errCode: "NOT_FOUND", code: "DATASET_NOT_EXISTS" }, req, res);
        }

        const validateEventAgainstSchema = schemaValidation(event, _.omit(schema, "$schema"));
        logger.info({ apiId, msgid, resmsgid, requestBody, message: validateEventAgainstSchema?.message })
        ResponseHandler.successResponse(req, res, { status: 200, data: { message: validateEventAgainstSchema?.message, isValid: validateEventAgainstSchema?.isValid } });
    }
    catch (error) {
        logger.error({ error, apiId, resmsgid: _.get(res, "resmsgid"), requestBody, code: "SCHEMA_VALIDATION_FAILURE", message: "Failed to validate event against schema" })
        ResponseHandler.errorResponse({ code: "SCHEMA_VALIDATION_FAILURE", message: "Failed to validate event against schema" }, req, res);
    }
}

