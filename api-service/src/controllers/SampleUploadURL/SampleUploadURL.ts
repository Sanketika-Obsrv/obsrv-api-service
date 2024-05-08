import { Request, Response } from "express"
import { cloudProvider } from "../../services/CloudServices"
import { config } from "../../configs/Config";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import _ from "lodash";

const sampleUploadURL = async (req: Request, res: Response) => {
    try {
        const files = req.body.request.files;
        const preSignedUrls = await Promise.all(cloudProvider.generateSignedURLs(config.cloud_config.container, files))
        const signedUrlList = _.map(preSignedUrls, list => ({
            fileName: _.keys(list)[0],
            preSignedUrl: _.values(list)[0]
        }))
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { signedUrlList } })
    } catch (error: any) {
        ResponseHandler.errorResponse(error, req, res);
    }
}

export default sampleUploadURL