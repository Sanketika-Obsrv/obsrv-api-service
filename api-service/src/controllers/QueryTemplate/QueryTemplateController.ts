import { Request, Response } from "express";
import { getQueryTemplate } from "../../services/QueryTemplateService";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import * as _ from "lodash";
import { handleTemplateQuery } from "./QueryTemplateHelpers";
import { config } from "../../configs/Config";
export const apiId = "api.query.template.query";
const requiredVariables = _.get(config, "template_config.template_required_variables");

export const queryTemplate = async (req: Request, res: Response) => {
    const template_id = req?.params?.templateId;
    try {
        const resmsgid = _.get(res, "resmsgid");
        const { startdate, enddate, dataset, table } = req.query;
        const expectedParams = [...requiredVariables, "TABLE"];
        const actualParamsReceived = _.keys(req.query).map((param) => { return param.toUpperCase() });

        if (!startdate || !enddate || !dataset || !table) {
            logger.error({ apiId, resmsgid, template_id, message: `Query params should includes ${expectedParams} but got ${actualParamsReceived}`, code: "QUERY_TEMPLATE_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ message: `Query params should includes ${expectedParams} but got ${actualParamsReceived}`, statusCode: 400, errCode: "BAD_REQUEST", code: "QUERY_TEMPLATE_INVALID_INPUT" }, req, res);
        }

        const template = await getQueryTemplate(template_id);
        if (template === null) {
            logger.error({ apiId, resmsgid, template_id, message: `Template ${template_id} does not exists`, code: "QUERY_TEMPLATE_NOT_EXISTS" })
            return ResponseHandler.errorResponse({ message: `Template ${template_id} does not exists`, statusCode: 404, errCode: "NOT_FOUND", code: "QUERY_TEMPLATE_NOT_EXISTS" }, req, res);
        }

        const response = await handleTemplateQuery(req, res, template?.dataValues?.query, template?.dataValues?.query_type)
        logger.info({ apiId, resmsgid, template_id, message: `Query executed successfully` })
        return ResponseHandler.successResponse(req, res, {
            status: 200, data: response?.data
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
