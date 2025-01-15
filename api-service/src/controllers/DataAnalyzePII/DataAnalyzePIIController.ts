import { Request, Response } from "express";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import * as _ from "lodash";
import logger from "../../logger";
import { detectPII } from "../../connections/commandServiceConnection";

const code = "FAILED_TO_DETECT_PII";
export const dataAnalyzePII = async (req: Request, res: Response) => {
    const apiId =  _.get(req, 'id')
    try {
        const userToken = req.get('authorization') as string;
        const piiSuggestionsResponse = await detectPII(_.get(req, ['body', 'request']), userToken);
        logger.info({apiId , message: `Detected PII successfully` })
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: _.get(piiSuggestionsResponse, ["data", "result"]) });
    } catch (error: any) {
        const errMessage = _.get(error, "response.data.detail")
        logger.error(error, apiId, code);
        let errorMessage = error;
        const statusCode = _.get(error, "status")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code, message: errMessage || "Failed to detect pii" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}