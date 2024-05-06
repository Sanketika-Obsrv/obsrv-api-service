import { Request, Response } from "express";
import * as _ from "lodash";
import { deleteTemplate } from "../../services/QueryTemplateService";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
const apiId = "api.query.template.delete";

export const deleteQueryTemplate = async (req: Request, res: Response) => {
    const template_id = _.get(req, 'params.templateId');
    try {
        const resmsgid = _.get(res, "resmsgid");

        const deleteResponse = await deleteTemplate(template_id);
        if (deleteResponse === 0) {
            logger.error({ apiId, resmsgid, template_id, message: `Template ${template_id} does not exists`, code: "QUERY_TEMPLATE_NOT_EXISTS" })
            return ResponseHandler.errorResponse({ message: `Template ${template_id} does not exists`, statusCode: 404, errCode: "NOT_FOUND", code: "QUERY_TEMPLATE_NOT_EXISTS" }, req, res);
        }

        logger.info({ apiId, resmsgid, template_id, message: `Templates ${template_id} deleted successfully` })
        return ResponseHandler.successResponse(req, res, { status: 200, data: { message: `Template ${template_id} deleted successfully` } });
    }
    catch (error) {
        logger.error({ error, apiId, resmsgid: _.get(res, "resmsgid"), template_id, message: "Failed to delete query template", code: "QUERY_TEMPLATE_DELETE_FAILED" })
        ResponseHandler.errorResponse({ code: "QUERY_TEMPLATE_DELETE_FAILED", message: "Failed to delete query template" }, req, res);
    }
}