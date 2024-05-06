import { Request, Response } from "express"
import { cloudProvider } from "../../services/CloudServices"
import { config } from "../../configs/Config";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";

const sampleUploadURL = async (req: Request, res: Response) => {
    try {
        const files = req.body.request.files;
        const list = await Promise.all(cloudProvider.generateSignedURLs(config.cloud_config.container, files))
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: {} })
    } catch (error: any) {
        ResponseHandler.errorResponse(error, req, res);

    }
}

export default sampleUploadURL