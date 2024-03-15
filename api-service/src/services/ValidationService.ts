import Ajv from "ajv";
import logger from "../logger";

export const schemaValidation = (payload: Record<string, any>, schema: Record<string, any>): Record<string, any> => {
    const validator = new Ajv();
    const isValid = validator.validate(schema, payload)
    if (!isValid) {
        const error: any = validator.errors;
        const errorMessage = error[0]?.schemaPath?.replace("/", "") + " " + error[0]?.message || "Invalid Request Body";
        logger.error(errorMessage)
        return { isValid, message: errorMessage }
    }
    return { isValid, message: "Success" }
}