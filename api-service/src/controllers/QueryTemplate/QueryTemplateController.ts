import { Request, Response } from "express";
import { getQueryTemplate } from "../../services/QueryTemplateService";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import * as _ from "lodash";
import { handleTemplateQuery } from "./QueryTemplateHelpers";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./QueryTemplateValidationSchema.json";
export const apiId = "api.query.template.query";

export const queryTemplate = async (req: Request, res: Response) => {
    const template_id = _.get(req, "params.templateId");
    const requestBody = _.get(req, "body");
    try {
        const resmsgid = _.get(res, "resmsgid");
        const msgid = _.get(req, "body.params.msgid");

        const isValidSchema = schemaValidation(requestBody, validationSchema);
        if (!isValidSchema?.isValid) {
            logger.error({ apiId, msgid, resmsgid, template_id, requestBody, message: isValidSchema?.message, code: "QUERY_TEMPLATE_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST", code: "QUERY_TEMPLATE_INVALID_INPUT" }, req, res);
        }

        const template = await getQueryTemplate(template_id);
        if (template === null) {
            logger.error({ apiId, msgid, resmsgid, template_id, requestBody, message: `Template ${template_id} does not exists`, code: "QUERY_TEMPLATE_NOT_EXISTS" })
            return ResponseHandler.errorResponse({ message: `Template ${template_id} does not exists`, statusCode: 404, errCode: "NOT_FOUND", code: "QUERY_TEMPLATE_NOT_EXISTS" }, req, res);
        }

        const response = await handleTemplateQuery(req, res, template?.dataValues?.query, template?.dataValues?.query_type)
        logger.info({
            apiId, msgid, resmsgid, template_id,
            query: template?.dataValues?.query,
            query_type: template?.dataValues?.query_type,
            requestBody, message: `Query executed successfully`
        })
        return ResponseHandler.successResponse(req, res, {
            status: 200, data: response?.data
        });
    }
    catch (error: any) {
        logger.error({ error, apiId, template_id, requestBody, resmsgid: _.get(res, "resmsgid"), code: "INTERNAL_SERVER_ERROR", message: "Unable to process the query" })
        const code = _.get(error, "code") || "INTERNAL_SERVER_ERROR"
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code, message: "Unable to process the query" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}
