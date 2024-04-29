import { Request, Response } from "express";
import * as _ from "lodash";
import { deleteTemplate } from "../../services/QueryTemplateService";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
const apiId = "query.template.delete";

export const deleteQueryTemplate = async (req: Request, res: Response) => {
    try {
        const template_id = _.get(req, 'params.templateId');
        const resmsgid = _.get(res, "resmsgid");

        const isTemplateExists = await deleteTemplate(template_id);
        if (isTemplateExists === 0) {
            logger.error({ apiId, resmsgid, requestBody: req?.body, message: `Template ${template_id} does not exists`, code: "QUERY_TEMPLATE_NOT_EXISTS" })
            return ResponseHandler.errorResponse({ message: `Template ${template_id} does not exists`, statusCode: 404, errCode: "NOT_FOUND", code: "QUERY_TEMPLATE_NOT_EXISTS" }, req, res);
        }
        
        logger.info({ apiId, resmsgid, requestBody: req?.body, message: `Templates ${template_id} deleted successfully` })
        return ResponseHandler.successResponse(req, res, { status: 200, data: { message: `Template ${template_id} deleted successfully` } });
    }
    catch (error) {
        logger.error({ error, apiId, resmsgid: _.get(res, "resmsgid"), requestBody: req?.body })
        let errorMessage: any = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code: "QUERY_TEMPLATE_CREATION_FAILED", message: "Failed to delete query template" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}