import { Request, Response } from 'express';
import { ResponseHandler } from '../../helpers/ResponseHandler';
import { container, formatFileData, getFileName, template_path, uploadFile, validateTemplate } from './QueryTemplateHelper';
import { logger } from '@azure/storage-blob';
import * as _ from "lodash";
const apiId = "query.template.create";

export const createQueryTemplate = async (req: Request, res: Response) => {
    try {
        const { templateData, templateName, fileExists, validTemplate, type } = await validateTemplate(req, true);
        if (!validTemplate) {
            logger.error({ apiId, message: `Invalid template provided, A template should consist of variables ["DATASET", "STARTDATE", "ENDDATE"] and type of json,sql`, code: "INVALID_TEMPLATE" })
            return ResponseHandler.errorResponse({ statusCode: 400, message: `Invalid template provided, A template should consist of variables ["DATASET", "STARTDATE", "ENDDATE"] and type of json,sql`, errCode: "BAD_REQUEST", code: "INVALID_TEMPLATE" }, req, res)
        }
        if (fileExists) {
            logger.error({ apiId, message: `A query template with the provided name already exists`, code: "TEMPLATE_EXIST" })
            return ResponseHandler.errorResponse({ statusCode: 400, message: "A query template with the provided name already exists", errCode: "BAD_REQUEST", code: "TEMPLATE_EXIST" }, req, res)
        }

        await uploadFile(container, getFileName(templateName), template_path, JSON.stringify(formatFileData(templateName, templateData, type)));
        return ResponseHandler.successResponse(req, res, { status: 200, data: { message: "The query template has been saved successfully" } });
    } catch (error: any) {
        const code = _.get(error, "code") || "TEMPLATE_CREATION_FAILED"
        logger.error({ ...error, apiId, code })
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code, message: "Failed to create query template" }
        }
        return ResponseHandler.errorResponse(errorMessage, req, res);
    }
}