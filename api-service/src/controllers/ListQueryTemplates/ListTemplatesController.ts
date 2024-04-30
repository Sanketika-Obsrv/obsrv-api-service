import { Request, Response } from "express";
import * as _ from "lodash";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./ListTemplateValidationSchema.json";
import { QueryTemplate } from "../../models/QueryTemplate";
const apiId = "api.query.template.list";

export const listQueryTemplates = async (req: Request, res: Response) => {
    const requestBody = req.body;
    try {
        const msgid = _.get(req, "body.params.msgid");
        const resmsgid = _.get(res, "resmsgid");
        const isValidSchema = schemaValidation(requestBody, validationSchema);

        if (!isValidSchema?.isValid) {
            logger.error({ apiId, msgid, resmsgid, requestBody, message: isValidSchema?.message, code: "QUERY_TEMPLATE_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST", code: "QUERY_TEMPLATE_INVALID_INPUT" }, req, res);
        }

        let templateData = await getTemplateList(requestBody.request);
        templateData = _.map(templateData, (data: any) => {
            return data?.dataValues
        })
        logger.info({ apiId, msgid, resmsgid, requestBody, message: `Templates are listed successfully` })
        return ResponseHandler.successResponse(req, res, { status: 200, data: templateData });
    }
    catch (error) {
        logger.error({ error, apiId, resmsgid: _.get(res, "resmsgid"), requestBody, code: "QUERY_TEMPLATE_LIST_FAILED", message: "Failed to list query templates" })
        ResponseHandler.errorResponse({ code: "QUERY_TEMPLATE_LIST_FAILED", message: "Failed to list query templates" }, req, res);
    }
}

const getTemplateList = async (req: Record<string, any>) => {
    const limit: any = _.get(req, "limit");
    const offset: any = _.get(req, "offset");
    const order: any = _.get(req, "order");
    const { filters = {} } = req || {};
    const templates = await QueryTemplate.findAll({ limit: limit || 100, offset: offset || 0, order, ...(filters && { where: filters }) })
    return templates
}