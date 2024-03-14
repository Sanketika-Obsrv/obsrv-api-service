import Ajv from "ajv";
import logger from "../logger";
import * as _ from "lodash";
import { Request } from "express";

export const schemaValidation = (payload: Record<string, any>, schema: Record<string, any>) => {
    const validator = new Ajv();
    const isValid = validator.validate(schema, payload)
    if (!isValid) {
        const error: any = validator.errors;
        const errorMessage = error[0]?.schemaPath?.replace("/", "") + " " + error[0]?.message || "Invalid Request Body";
        logger.error(errorMessage)
        throw { isValid, message: errorMessage, statusCode:400, errCode:"BAD_REQUEST" }
    }
    else {
        return isValid;
    }
}