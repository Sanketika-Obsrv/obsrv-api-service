import { Request, Response } from "express";
import * as _ from "lodash";
import { listTemplates } from "../../services/QueryTemplateService";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./ListTemplateValidationSchema.json";
const apiId = "api.query.template.read";

export const listQueryTemplates = async (req: Request, res: Response) => {
    const requestBody = req.body;
    try {
        const msgid = _.get(req, "body.params.msgid");
        const resmsgid = _.get(res, "resmsgid");
        const limit: any = _.get(req, "body.request.limit");
        const offset: any = _.get(req, "body.request.offset");
        const isValidSchema = schemaValidation(requestBody, validationSchema);

        if (!isValidSchema?.isValid) {
            logger.error({ apiId, msgid, resmsgid, requestBody, message: isValidSchema?.message, code: "QUERY_TEMPLATE_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST", code: "QUERY_TEMPLATE_INVALID_INPUT" }, req, res);
        }

        const templates = await listTemplates(limit, offset);
        const templateData = _.map(templates, (data) => {
            return data?.dataValues
        })

        logger.info({ apiId, msgid, resmsgid, requestBody, message: `Templates are listed successfully` })
        return ResponseHandler.successResponse(req, res, { status: 200, data: templateData });
    }
    catch (error) {
        logger.error({ error, apiId, resmsgid: _.get(res, "resmsgid"), requestBody })
        ResponseHandler.errorResponse({ code: "QUERY_TEMPLATE_LIST_FAILED", message: "Failed to list query templates" }, req, res);
    }
}