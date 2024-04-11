import { Request, Response } from "express";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { setApiId } from "../../services/DatasetService";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./DataOutValidationSchema.json";
import { validateQuery } from "./QueryValidator";
import * as _ from "lodash";
import { executeNativeQuery, executeSqlQuery } from "../../connections/druidConnection";

const dataOut = async (req: Request, res: Response) => {
    try {
        const isValidSchema = schemaValidation(req.body, validationSchema);
        if (!isValidSchema?.isValid) {
            return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST" }, req, res);
        }
        const isValidQuery: any = await validateQuery(req.body);
        const query = _.get(req, "body.query", "")

        if (isValidQuery === true && _.isObject(query)) {
            const result = await executeNativeQuery(query);
            logger.info("Native query executed successfully")
            return ResponseHandler.successResponse(req, res, {
                status: 200, data: result?.data
            });
        }

        if (isValidQuery === true && _.isString(query)) {
            const result = await executeSqlQuery({ query })
            logger.info("SQL query executed successfully")
            return ResponseHandler.successResponse(req, res, {
                status: 200, data: result?.data
            });
        }

        else {
            return ResponseHandler.errorResponse({ message: isValidQuery?.message, statusCode: isValidQuery?.statusCode, errCode: isValidQuery?.errCode }, req, res);
        }
    }
    catch (err: any) {
        logger.error({ err })
        return ResponseHandler.errorResponse({ message: "Unable to process the query.", statusCode: 500, errCode: "INTERNAL_SERVER_ERROR" }, req, res);
    }
}

export default dataOut;