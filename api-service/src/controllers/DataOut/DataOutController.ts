import { Request, Response } from "express";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./DataOutValidationSchema.json";
import { validateQuery } from "./QueryValidator";
import * as _ from "lodash";
import { executeNativeQuery, executeSqlQuery } from "../../connections/druidConnection";

export const apiId = "api.data.out";
const dataOut = async (req: Request, res: Response) => {
    const datasetId = req.params?.datasetId;
    const requestBody = req.body;
    const msgid = _.get(req, "body.params.msgid");
    try {
        const isValidSchema = schemaValidation(requestBody, validationSchema);
        if (!isValidSchema?.isValid) {
            logger.error({ apiId, datasetId, msgid, requestBody, message: isValidSchema?.message, code: "DATA_OUT_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST", code: "DATA_OUT_INVALID_INPUT" }, req, res);
        }
        const isValidQuery: any = await validateQuery(req.body, datasetId);
        const query = _.get(req, "body.query", "")

        if (isValidQuery === true && _.isObject(query)) {
            const result = await executeNativeQuery(query);
            logger.info({ apiId, msgid, requestBody, datasetId, message: "Native query executed successfully" })
            return ResponseHandler.successResponse(req, res, {
                status: 200, data: result?.data
            });
        }

        if (isValidQuery === true && _.isString(query)) {
            const result = await executeSqlQuery({ query })
            logger.info({ apiId, msgid, requestBody, datasetId, message: "SQL query executed successfully" })
            return ResponseHandler.successResponse(req, res, {
                status: 200, data: result?.data
            });
        }

        else {
            logger.error({ apiId, msgid, requestBody, datasetId, message: isValidQuery?.message, code: isValidQuery?.code })
            return ResponseHandler.errorResponse({ message: isValidQuery?.message, statusCode: isValidQuery?.statusCode, errCode: isValidQuery?.errCode, code: isValidQuery?.code }, req, res);
        }
    }
    catch (err: any) {
        logger.error({ ...err, apiId, code: err?.code || "INTERNAL_SERVER_ERROR" })
        let errorMessage = err;
        const statusCode = _.get(err, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code: "INTERNAL_SERVER_ERROR", message: "Unable to process the query." }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

export default dataOut;