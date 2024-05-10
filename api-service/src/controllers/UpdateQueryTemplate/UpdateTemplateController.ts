import { Request, Response } from "express";
import * as _ from "lodash"
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./UpdateTemplateValidationSchema.json";
import { logger } from "@azure/storage-blob";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { getQueryTemplate } from "../../services/QueryTemplateService";
import { QueryTemplate } from "../../models/QueryTemplate";
import { validateTemplate } from "../CreateQueryTemplate/QueryTemplateValidator";
import { config } from "../../configs/Config";
const apiId = "api.query.template.update";
const requiredVariables = _.get(config, "template_config.template_required_variables");

export const updateQueryTemplate = async (req: Request, res: Response) => {
    const requestBody = req.body;
    try {
        const msgid = _.get(req, "body.params.msgid");
        const resmsgid = _.get(res, "resmsgid");
        const templateId = _.get(req, "params.templateId");
        const isValidSchema = schemaValidation(requestBody, validationSchema);

        if (!isValidSchema?.isValid) {
            if (_.includes(isValidSchema.message, "template_name")) {
                _.set(isValidSchema, "message", "Template name should contain alphanumeric characters and single space between characters")
            }
            logger.error({ apiId, msgid, resmsgid, requestBody, message: isValidSchema?.message, code: "QUERY_TEMPLATE_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST", code: "QUERY_TEMPLATE_INVALID_INPUT" }, req, res);
        }

        const isTemplateExists = await getQueryTemplate(templateId)
        if (isTemplateExists === null) {
            logger.error({ apiId, resmsgid, requestBody, message: `Template ${templateId} does not exists`, code: "QUERY_TEMPLATE_NOT_EXISTS" })
            return ResponseHandler.errorResponse({ message: `Template ${templateId} does not exists`, statusCode: 404, errCode: "NOT_FOUND", code: "QUERY_TEMPLATE_NOT_EXISTS" }, req, res);
        }

        const { validTemplate } = await validateTemplate(requestBody);
        if (!validTemplate) {
            logger.error({ apiId, msgid, resmsgid, requestBody: req?.body, message: `Invalid template provided, A template should consist of variables ${requiredVariables} and type of json,sql`, code: "QUERY_TEMPLATE_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ statusCode: 400, message: `Invalid template provided, A template should consist of variables ${requiredVariables} and type of json,sql`, errCode: "BAD_REQUEST", code: "QUERY_TEMPLATE_INVALID_INPUT" }, req, res)
        }

        await QueryTemplate.update(requestBody?.request, { where: { template_id: templateId } })
        logger.info({ apiId, msgid, resmsgid, requestBody, message: `Query template updated successfully` })
        ResponseHandler.successResponse(req, res, { status: 200, data: { message: "Query template updated successfully", templateId } });
    }
    catch (error) {
        logger.error({ error, apiId, resmsgid: _.get(res, "resmsgid"), requestBody, code: "QUERY_TEMPLATE_UPDATE_FAILED", message: "Failed to update query template" })
        ResponseHandler.errorResponse({ code: "QUERY_TEMPLATE_UPDATE_FAILED", message: "Failed to update query template" }, req, res);
    }
}

