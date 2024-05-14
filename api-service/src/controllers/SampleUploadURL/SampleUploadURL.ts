import { Request, Response } from "express"
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import _ from "lodash";
import logger from "../../logger";
import { ErrorObject } from "../../types/ResponseModel";
import { schemaValidation } from "../../services/ValidationService";
import SampleUploadURL from "./SampleUploadURLValidationSchema.json"
import { cloudProvider } from "../../services/CloudServices";
import { config } from "../../configs/Config";

export const apiId = "api.datasets.upload-url"
export const errorCode = "DATASET_UPLOAD_URL_FAILURE"

const sampleUploadURL = async (req: Request, res: Response) => {
    const requestBody = req.body
    const msgid = _.get(req, ["body", "params", "msgid"]);
    const resmsgid = _.get(res, "resmsgid");
    try {
        const isRequestValid: Record<string, any> = schemaValidation(req.body, SampleUploadURL)
        if (!isRequestValid.isValid) {
            const code = "DATASETS_UPLOAD_URL_INPUT_INVALID"
            logger.error({ code, apiId, message: isRequestValid.message })
            return ResponseHandler.errorResponse({
                code,
                message: isRequestValid.message,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }
        
        const fileList = req.body.request.files;

        if (_.isEmpty(fileList)) {
            const code = "DATASET_FILES_NOT_PROVIDED"
            logger.error({ code, apiId, requestBody, msgid, resmsgid, message: `No files are provided to generate upload urls` })
            return ResponseHandler.errorResponse({
                code,
                statusCode: 400,
                message: "No files are provided to generate upload urls",
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const preSignedUrls = await Promise.all(cloudProvider.generateSignedURLs(config.cloud_config.container, fileList))
        const signedUrlList = _.map(preSignedUrls, list => ({
            fileName: _.keys(list)[0],
            preSignedUrl: _.values(list)[0]
        }))

        logger.info({ apiId, requestBody, msgid, resmsgid, message: `Dataset sample upload url generated successfully for files:${fileList}` })
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: signedUrlList })
    } catch (error: any) {
        logger.error({ ...error, apiId, code: errorCode });
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code: errorCode, message: "Failed to generate sample upload-url" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

export default sampleUploadURL