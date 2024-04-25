import { Request, Response } from "express";
import logger from "../../logger";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./CreateTemplateValidationSchema.json";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { getQueryTemplate } from "../../services/QueryTemplateService";
import * as _ from "lodash";
import { validateTemplate } from "./QueryTemplateValidator";
import { QueryTemplate } from "../../models/QueryTemplate";
const apiId = "query.template.create";

export const createQueryTemplate = async (req: Request, res: Response) => {
    try {
        const templateName = req.params?.templateName;
        const requestBody = req.body;
        const isValidSchema = schemaValidation(requestBody, validationSchema)
        console.log({ isValidSchema })
        if (!isValidSchema?.isValid) {
            logger.error({ apiId, message: isValidSchema?.message, code: "QUERY_TEMPLATE_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST", code: "QUERY_TEMPLATE_INVALID_INPUT" }, req, res);
        }

        const isTemplateExists = await getQueryTemplate(templateName)
        if (isTemplateExists !== null) {
            logger.error({ apiId, message: `Template ${templateName} already exists`, code: "QUERY_TEMPLATE_ALREADY_EXISTS" })
            return ResponseHandler.errorResponse({ message: `Template ${templateName} already exists`, statusCode: 409, errCode: "CONFLICT", code: "QUERY_TEMPLATE_ALREADY_EXISTS" }, req, res);
        }

        const { validTemplate } = await validateTemplate(requestBody, true);
        if (!validTemplate) {
            logger.error({ apiId, message: `Invalid template provided, A template should consist of variables ["DATASET", "STARTDATE", "ENDDATE"] and type of json,sql`, code: "QUERY_TEMPLATE_INVALID" })
            return ResponseHandler.errorResponse({ statusCode: 400, message: `Invalid template provided, A template should consist of variables ["DATASET", "STARTDATE", "ENDDATE"] and type of json,sql`, errCode: "BAD_REQUEST", code: "QUERY_TEMPLATE_INVALID" }, req, res)
        }

        const data = transformRequest(req);
        await QueryTemplate.create(data)
        logger.info({ apiId, message: `Query template created successfully` })
        return ResponseHandler.successResponse(req, res, { status: 200, data: { message: "The query template has been saved successfully" } });
    }
    catch (error) {
        logger.error(error)
        let errorMessage: any = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code: "QUERY_TEMPLATE_CREATION_FAILED", message: "Failed to query template" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const transformRequest = (req: any) => {
    const templateName = _.get(req, "params.templateName");
    const type: any = _.get(req, "body.request.query_type");
    const query = _.get(req, "body.request.query")
    const data = {
        template_name: templateName,
        query_type: type,
        query: query
    }
    return data
}