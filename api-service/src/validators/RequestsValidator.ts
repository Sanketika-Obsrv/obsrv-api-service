import httpStatus from "http-status";
import { IValidator } from "../types/DatasetModels";
import { ValidationStatus } from "../types/ValidationModels";

export class RequestsValidator implements IValidator {
    private schemaBasePath: string = "/src/resources/";
    private reqSchemaMap = new Map<string, any>();
    // private validator: Ajv;

    constructor() {
        // this.validator = new Ajv();
        // addFormats(this.validator);
        // this.loadSchemas();
    }

    validate(): ValidationStatus {
        return this.validateRequest();
    }

    validateQueryParams(): ValidationStatus {
        return this.validateRequestParams();
    }

    private validateRequest(): ValidationStatus {
        // const validRequestObj = this.validator.validate(this.getReqSchema(id), data);
        // if (!validRequestObj) {
        //     const error = this.validator.errors;
        //     const errorMessage = error![0].instancePath.replace("/", "") + " " + error![0].message;
        //     return { error: httpStatus["400_NAME"], isValid: false, message: errorMessage, code: httpStatus["400_NAME"] };
        // } else {
            return { isValid: true, message: "Validation Success", code: httpStatus[200] };
        // }
    }

    private validateRequestParams(): ValidationStatus {
        // const validRequestObj = this.validator.validate(this.getReqSchema(id), data);
        // if (!validRequestObj) {
        //     const error = this.validator.errors;
        //     const property = error![0].instancePath.replace("/", "");
        //     const errorMessage = `property "${property}"` + " " + error![0].message;
        //     return { error: httpStatus["400_NAME"], isValid: false, message: errorMessage, code: httpStatus["400_NAME"] };
        // } else {
            return { isValid: true, message: "Validation Success", code: httpStatus[200] };
        // }
    }
}
