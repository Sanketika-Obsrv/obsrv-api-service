import { Request, Response } from "express"
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import _ from "lodash";
import logger from "../../logger";
import { ErrorObject } from "../../types/ResponseModel";
import { schemaValidation } from "../../services/ValidationService";
import GenerateURL from "./GenerateSignedURLValidationSchema.json"
import { config } from "../../configs/Config";
import { URLAccess } from "../../types/SampleURLModel";
import { generatePreSignedUrl } from "./helper";

export const apiId = "api.files.generate-url"
export const code = "FILES_GENERATE_URL_FAILURE"
const maxFiles = config.presigned_url_configs.maxFiles
let containerType: string;

const generateSignedURL = async (req: Request, res: Response) => {
    const requestBody = req.body
    const msgid = _.get(req, ["body", "params", "msgid"]);
    const resmsgid = _.get(res, "resmsgid");
    containerType = _.get(req, ["body", "request", "type"]);
    try {
        const isRequestValid: Record<string, any> = schemaValidation(req.body, GenerateURL)
        if (!isRequestValid.isValid) {
            const code = "FILES_GENERATE_URL_INPUT_INVALID"
            logger.error({ code, apiId, message: isRequestValid.message })
            return ResponseHandler.errorResponse({
                code,
                message: isRequestValid.message,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const { files, access = URLAccess.Write } = req.body.request;

        const isLimitExceed = checkLimitExceed(files)
        if (isLimitExceed) {
            const code = "FILES_URL_GENERATION_LIMIT_EXCEED"
            logger.error({ code, apiId, requestBody, msgid, resmsgid, message: `Pre-signed URL generation failed: Number of files${_.size(files)}} exceeded the limit of ${maxFiles}` })
            return ResponseHandler.errorResponse({
                code,
                statusCode: 400,
                message: "Pre-signed URL generation failed: limit exceeded.",
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }
        const signedUrlList = await generatePreSignedUrl(access, files, containerType)
        logger.info({ apiId, requestBody, msgid, resmsgid, response: signedUrlList, message: `Sample urls generated successfully for files:${files}` })
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: signedUrlList })
    } catch (error: any) {
        logger.error(error, apiId, msgid, requestBody, resmsgid, code);
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code, message: "Failed to generate sample urls" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const checkLimitExceed = (files: Array<string>): boolean => {
    return _.size(files) > maxFiles
}

export default generateSignedURL;