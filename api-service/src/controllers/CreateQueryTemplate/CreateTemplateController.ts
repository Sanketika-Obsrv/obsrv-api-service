import { Request, Response } from "express";
import logger from "../../logger";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./CreateTemplateValidationSchema.json";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { getQueryTemplate } from "../../services/QueryTemplateService";
import * as _ from "lodash";
import { validateTemplate } from "./QueryTemplateValidator";
import { QueryTemplate } from "../../models/QueryTemplate";
import slug from "slug";
import { config } from "../../configs/Config";
const apiId = "api.query.template.create";
const requiredVariables = _.get(config, "template_config.template_required_variables");

export const createQueryTemplate = async (req: Request, res: Response) => {
    try {
        const msgid = _.get(req, "body.params.msgid");
        const resmsgid = _.get(res, "resmsgid");
        const templateName = _.get(req, "body.request.template_name");
        const templateId: string = slug(templateName, '_');
        const requestBody = req.body;
        const isValidSchema = schemaValidation(requestBody, validationSchema);

        if (!isValidSchema?.isValid) {
            if (_.includes(isValidSchema.message, "template_name")) {
                _.set(isValidSchema, "message", "Template name should contain alphanumeric characters and single space between characters")
            }
            logger.error({ apiId, msgid, resmsgid, requestBody: req?.body, message: isValidSchema?.message, code: "QUERY_TEMPLATE_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST", code: "QUERY_TEMPLATE_INVALID_INPUT" }, req, res);
        }

        const isTemplateExists = await getQueryTemplate(templateId)
        if (isTemplateExists !== null) {
            logger.error({ apiId, msgid, resmsgid, requestBody: req?.body, message: `Template ${templateName} already exists`, code: "QUERY_TEMPLATE_ALREADY_EXISTS" })
            return ResponseHandler.errorResponse({ message: `Template ${templateName} already exists`, statusCode: 409, errCode: "CONFLICT", code: "QUERY_TEMPLATE_ALREADY_EXISTS" }, req, res);
        }

        const { validTemplate } = await validateTemplate(requestBody);
        if (!validTemplate) {
            logger.error({ apiId, msgid, resmsgid, requestBody: req?.body, message: `Invalid template provided, A template should consist of variables ${requiredVariables} and type of json,sql`, code: "QUERY_TEMPLATE_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ statusCode: 400, message: `Invalid template provided, A template should consist of variables ${requiredVariables} and type of json,sql`, errCode: "BAD_REQUEST", code: "QUERY_TEMPLATE_INVALID_INPUT" }, req, res)
        }

        const data = transformRequest(requestBody, templateName);
        await QueryTemplate.create(data)
        logger.info({ apiId, msgid, resmsgid, requestBody: req?.body, message: `Query template created successfully` })
        return ResponseHandler.successResponse(req, res, { status: 200, data: { template_id: templateId, template_name: templateName, message: `The query template has been saved successfully` } });
    }
    catch (error) {
        logger.error({ error, apiId, resmsgid: _.get(res, "resmsgid"), requestBody: req?.body })
        let errorMessage: any = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code: "QUERY_TEMPLATE_CREATION_FAILED", message: "Failed to create query template" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const transformRequest = (req: any, templateName: string) => {
    const type: any = _.get(req, "request.query_type");
    const query = _.get(req, "request.query")
    const data = {
        template_id: slug(templateName, '_'),
        template_name: templateName,
        query_type: type,
        query: query
    }
    return data
}
