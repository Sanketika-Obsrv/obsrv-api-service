import Ajv from "ajv";
import logger from "../logger";
import _ from "lodash";
import { Request } from "express";

export const schemaValidation = async (payload: Record<string, any>, schema: Record<string, any>) => {
    return new Promise((resolve, reject) => {
        const validator = new Ajv();
        const isValid = validator.validate(schema, payload)
        if (!isValid) {
            const error: any = validator.errors;
            const errorMessage = error[0]?.schemaPath?.replace("/", "") + " " + error[0]?.message || "Invalid Request Body";
            logger.error(errorMessage)
            reject(errorMessage)
        }
        resolve(isValid)
    })
}

export const setApiId = async (req: Request) => {
    return _.set(req, "id", "dataset.create")
}