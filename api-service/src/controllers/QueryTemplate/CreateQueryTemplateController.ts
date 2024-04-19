import { Request, Response } from 'express';
import { ResponseHandler } from '../../helpers/ResponseHandler';
import { container, formatFileData, getFileName, template_path, uploadFile, validateTemplate } from './QueryTemplateHelper';
import { logger } from '@azure/storage-blob';

export const createQueryTemplate = async (req: Request, res: Response) => {
    try {
        const { templateData, templateName, fileExists, validTemplate, type } = await validateTemplate(req, true);
        if (!validTemplate) {
            return ResponseHandler.errorResponse({ statusCode: 400, message: `Invalid template provided, A template should consist of variables ["DATASET", "STARTDATE", "ENDDATE"] and type of json,sql`, errCode: "BAD_REQUEST" }, req, res)
        }
        if (fileExists) {
            return ResponseHandler.errorResponse({ statusCode: 400, message: "A query template with the provided name already exists", errCode: "BAD_REQUEST" }, req, res)
        }

        await uploadFile(container, getFileName(templateName), template_path, JSON.stringify(formatFileData(templateName, templateData, type)));
        
        return ResponseHandler.successResponse(req, res, { status: 200, data: { message: "The query template has been saved successfully" } });
    } catch (error: any) {
        logger.error("ERROR", error)
        return ResponseHandler.errorResponse({ statusCode: 400, message: "Failed to create query template", errCode: "BAD_REQUEST", code: "TEMPLATE_CREATION_FAILED" }, req, res);
    }
}