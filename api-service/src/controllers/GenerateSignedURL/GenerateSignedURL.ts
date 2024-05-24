import { Request, Response } from "express"
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import _ from "lodash";
import logger from "../../logger";
import { ErrorObject } from "../../types/ResponseModel";
import { schemaValidation } from "../../services/ValidationService";
import GenerateURL from "./GenerateSignedURLValidationSchema.json"
import { cloudProvider } from "../../services/CloudServices";
import { config } from "../../configs/Config";
import { URLAccess } from "../../types/SampleURLModel";
import { v4 as uuidv4 } from 'uuid';
import path from "path";

export const apiId = "api.files.generate-url"
export const code = "FILES_GENERATE_URL_FAILURE"
const maxFiles = config.presigned_url_configs.maxFiles

const generateSignedURL = async (req: Request, res: Response) => {
    const requestBody = req.body
    const msgid = _.get(req, ["body", "params", "msgid"]);
    const resmsgid = _.get(res, "resmsgid");
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

        const { filesList, updatedFileNames } = transformFileNames(files, access)
        logger.info(`Updated file names with path:${updatedFileNames}`)

        const urlExpiry: number = getURLExpiry(access)
        const preSignedUrls = await Promise.all(cloudProvider.generateSignedURLs(config.cloud_config.container, updatedFileNames, access, urlExpiry))
        const signedUrlList = _.map(preSignedUrls, list => {
            const fileNameWithUid = _.keys(list)[0]
            return {
                filePath: getFilePath(fileNameWithUid),
                fileName: filesList.get(fileNameWithUid),
                preSignedUrl: _.values(list)[0]
            }
        })

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

const getFilePath = (file: string) => {
    return `${config.cloud_config.container}/${config.presigned_url_configs.service}/user_uploads/${file}`
}

const transformFileNames = (fileList: Array<string | any>, access: string): Record<string, any> => {
    if (access === URLAccess.Read) {
        return transformReadFiles(fileList)
    }
    return transformWriteFiles(fileList)
}

const transformReadFiles = (fileNames: Array<string | any>) => {
    const fileMap = new Map();
    const updatedFileNames = _.map(fileNames, file => {
        fileMap.set(file, file)
        return getFilePath(file)
    })
    return { filesList: fileMap, updatedFileNames }
}

const transformWriteFiles = (fileNames: Array<string | any>) => {
    const fileMap = new Map();
    const updatedFileNames = _.map(fileNames, file => {
        const uuid = uuidv4().replace(/-/g, '').slice(0, 6);
        const ext = path.extname(file)
        const baseName = path.basename(file, ext)
        const updatedFileName = `${baseName}_${uuid}${ext}`
        fileMap.set(updatedFileName, file)
        return getFilePath(updatedFileName)
    })
    return { filesList: fileMap, updatedFileNames }

}

const getURLExpiry = (access: string) => {
    return access === URLAccess.Read ? config.presigned_url_configs.read_storage_url_expiry : config.presigned_url_configs.write_storage_url_expiry
}

const checkLimitExceed = (files: Array<string>): boolean => {
    return _.size(files) > maxFiles
}

export default generateSignedURL;