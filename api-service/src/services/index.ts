import Ajv from "ajv";
import logger from "../logger";
import _ from "lodash";
import { Request } from "express";

export const schemaValidation = async (payload: Record<string, any>, schema: Record<string, any>) => {
    const validator = new Ajv();
    const isValid = validator.validate(schema, payload)
    if (!isValid) {
        const error: any = validator.errors;
        logger.error(error)
        throw new Error(error?.message)
    }
    return isValid;
}

export const setApiId = async (req: Request) => {
    return _.set(req, "id", "dataset.create")
}