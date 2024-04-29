import { Request, Response } from "express";
import * as _ from "lodash";
import { listTemplates } from "../../services/QueryTemplateService";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
const apiId = "query.template.read";

export const listQueryTemplates = async (req: Request, res: Response) => {
    try {
        const resmsgid = _.get(res, "resmsgid");
        const limit: any = _.get(req, "query.limit")
        const offset: any = _.get(req, "query.offset")

        const templates = await listTemplates(limit, offset);
        const templateData = _.map(templates, (data) => {
            return data?.dataValues
        })

        logger.info({ apiId, resmsgid, message: `Templates are listed successfully` })
        return ResponseHandler.successResponse(req, res, { status: 200, data: templateData });
    }
    catch (error) {
        logger.error({ error, apiId, resmsgid: _.get(res, "resmsgid") })
        ResponseHandler.errorResponse({ code: "QUERY_TEMPLATE_LIST_FAILED", message: "Failed to list query templates" }, req, res);
    }
}