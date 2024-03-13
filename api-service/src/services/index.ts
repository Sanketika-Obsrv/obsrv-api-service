import Ajv from "ajv";
import logger from "../logger";
import * as _ from "lodash";
import { Request } from "express";

export const schemaValidation = (payload: any, schema: any) => {
    return new Promise((resolve, reject) => {
        const validator = new Ajv();
        const isValid = validator.validate(schema, payload);
        if (!isValid) {
            const error: any = validator.errors;
            const errorMessage = error[0].instancePath.replace("/", "") + " " + error[0].message;
            logger.error({ errorMessage });
            reject(new Error(errorMessage));
        } else {
            resolve(isValid);
        }
    });
};

export const setApiId = async (req: Request) => {
    return _.set(req, "id", "dataset.create")
}