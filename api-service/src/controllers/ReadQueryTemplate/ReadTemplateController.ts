import { Request, Response } from "express";
import * as _ from "lodash";
import { getQueryTemplate } from "../../services/QueryTemplateService";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
const apiId = "query.template.read";

export const readQueryTemplate = async (req: Request, res: Response) => {
    const template_id = _.get(req, 'params.templateId');
    try {
        const resmsgid = _.get(res, "resmsgid");

        const isTemplateExists = await getQueryTemplate(template_id);
        if (isTemplateExists === null) {
            logger.error({ apiId, resmsgid, template_id, message: `Template ${template_id} does not exists`, code: "QUERY_TEMPLATE_NOT_EXISTS" })
            return ResponseHandler.errorResponse({ message: `Template ${template_id} does not exists`, statusCode: 404, errCode: "NOT_FOUND", code: "QUERY_TEMPLATE_NOT_EXISTS" }, req, res);
        }
        logger.info({ apiId, resmsgid, template_id, message: `Template read successfully with id: ${template_id}` })
        return ResponseHandler.successResponse(req, res, { status: 200, data: isTemplateExists?.dataValues });
    }
    catch (error) {
        logger.error({ error, apiId, template_id, resmsgid: _.get(res, "resmsgid") })
        ResponseHandler.errorResponse({ code: "QUERY_TEMPLATE_READ_FAILED", message: "Failed to read query template" }, req, res);
    }
}