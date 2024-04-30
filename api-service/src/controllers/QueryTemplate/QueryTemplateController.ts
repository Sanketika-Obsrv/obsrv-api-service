import { Request, Response } from "express";
import { getQueryTemplate } from "../../services/QueryTemplateService";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import * as _ from "lodash";
import { handleTemplateQuery } from "./QueryTemplateHelpers";
const apiId = "api.query.template.query";


export const queryTemplate = async (req: Request, res: Response) => {
    const template_id = req?.params?.templateId;
    try {
        const template = await getQueryTemplate(template_id);
        const resmsgid = _.get(res, "resmsgid");
        if (template === null) {
            logger.error({ apiId, resmsgid, template_id, message: `Template ${template_id} does not exists`, code: "QUERY_TEMPLATE_NOT_EXISTS" })
            return ResponseHandler.errorResponse({ message: `Template ${template_id} does not exists`, statusCode: 404, errCode: "NOT_FOUND", code: "QUERY_TEMPLATE_NOT_EXISTS" }, req, res);
        }
        const resposne = await handleTemplateQuery(req, res, template?.dataValues?.query, template?.dataValues?.query_type)
        logger.info({ apiId, resmsgid, template_id, message: `Query executed successfully` })
        return ResponseHandler.successResponse(req, res, {
            status: 200, data: resposne?.data
        });
    }
    catch (error: any) {
        logger.error({ error, apiId, template_id, resmsgid: _.get(res, "resmsgid"), code: "INTERNAL_SERVER_ERROR", message: "Unable to process the query" })
        const code = _.get(error, "code") || "INTERNAL_SERVER_ERROR"
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code, message: "Unable to process the query" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}
