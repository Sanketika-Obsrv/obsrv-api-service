import { Request, Response } from "express";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import _ from "lodash";
import logger from "../../logger";
import axios from "axios";
import httpStatus from "http-status";
import busboy from "busboy";
import { PassThrough } from "stream";
import { generatePreSignedUrl } from "../GenerateSignedURL/helper";
import { registerConnector } from "../../connections/commandServiceConnection";

export const apiId = "api.connector.register";
export const code = "FAILED_TO_REGISTER_CONNECTOR";

let resmsgid: string | any;

const connectorRegisterController = async (req: Request, res: Response) => {
    resmsgid = _.get(res, "resmsgid");
    try {
        const uploadStreamResponse: any = await uploadStream(req);
        const payload = {
            relative_path: uploadStreamResponse[0]
        }
        logger.info({ apiId, resmsgid, message: `File uploaded to cloud provider successfully` })
        const registryResponse = await registerConnector(payload);
        logger.info({ apiId, resmsgid, message: `Connector registered successfully` })
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: registryResponse?.data?.message } })
    } catch (error: any) {
        const errMessage = _.get(error, "response.data.error.message")
        logger.error(error, apiId, resmsgid, code);
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code, message: errMessage || "Failed to register connector" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
};

const uploadStream = async (req: Request) => {
    return new Promise((resolve, reject) => {
        const filePromises: Promise<void>[] = [];
        const busboyClient = busboy({ headers: req.headers });
        const relative_path: any[] = [];
        let fileCount = 0;

        busboyClient.on("file", async (name: any, file: any, info: any) => {
            if (fileCount > 0) {
                // If more than one file is detected, reject the request
                busboyClient.emit("error", reject({
                    code: "FAILED_TO_UPLOAD",
                    message: "Uploading multiple files are not allowed",
                    statusCode: 400,
                    errCode: "BAD_REQUEST"
                }));
                return
            }
            fileCount++;
            const processFile = async () => {
                const fileName = info?.filename;
                try {
                    const preSignedUrl: any = await generatePreSignedUrl("write", [fileName], "connector")
                    const filePath = preSignedUrl[0]?.filePath
                    const fileNameExtracted = extractFileNameFromPath(filePath);
                    relative_path.push(...fileNameExtracted);
                    const pass = new PassThrough();
                    file.pipe(pass);
                    const fileBuffer = await streamToBuffer(pass);
                    await axios.put(preSignedUrl[0]?.preSignedUrl, fileBuffer, {
                        headers: {
                            "Content-Type": info.mimeType,
                            "Content-Length": fileBuffer.length,
                        }
                    });
                }
                catch (err) {
                    logger.error({ apiId, err, resmsgid, message: "Failed to generate sample urls", code: "FILES_GENERATE_URL_FAILURE" })
                    reject({
                        code: "FILES_GENERATE_URL_FAILURE",
                        message: "Failed to generate sample urls",
                        statusCode: 500,
                        errCode: "INTERNAL_SERVER_ERROR"
                    })
                }
            };
            filePromises.push(processFile());
        });
        busboyClient.on("close", async () => {
            try {
                await Promise.all(filePromises);
                resolve(relative_path);
            } catch (error) {
                logger.error({ apiId, error, resmsgid, message: "Fail to upload a file", code: "FAILED_TO_UPLOAD" })
                reject({
                    code: "FAILED_TO_UPLOAD",
                    message: "Fail to upload a file",
                    statusCode: 400,
                    errCode: "BAD_REQUEST"
                });
            }
        });
        busboyClient.on("error", reject);
        req.pipe(busboyClient);
    })
}

const streamToBuffer = (stream: PassThrough): Promise<Buffer> => {
    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
    });
};

const extractFileNameFromPath = (filePath: string): string[] => {
    const regex = /(?<=\/)[^/]+\.[^/]+(?=\/|$)/g;
    return filePath.match(regex) || [];
};

export default connectorRegisterController;
