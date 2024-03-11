import fs from "fs";
import httpStatus from "http-status";
import { IValidator } from "../types/DatasetModels";
import { ValidationStatus } from "../types/ValidationModels";
import { routesConfig } from "../configs/RoutesConfig";

export class RequestsValidator implements IValidator {
    private schemaBasePath: string = "/src/resources/";
    private reqSchemaMap = new Map<string, any>();
    // private validator: Ajv;

    constructor() {
        // this.validator = new Ajv();
        // addFormats(this.validator);
        this.loadSchemas();
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

    private schemasMapping(): Record<string, any> {
        return [
            routesConfig.query.native_query,
            routesConfig.query.sql_query,
            routesConfig.data_ingest,
            routesConfig.tenant_ingest,
            routesConfig.config.dataset.save,
            routesConfig.config.datasource.save,
            routesConfig.config.dataset.list,
            routesConfig.config.datasource.list,
            routesConfig.config.dataset.update,
            routesConfig.config.datasource.update,
            routesConfig.config.dataset_source_config.save,
            routesConfig.config.dataset_source_config.update,
            routesConfig.config.dataset_source_config.list,
            routesConfig.exhaust,
            routesConfig.submit_ingestion
        ]
    }

    private loadSchemas(): void {
        this.schemasMapping().map((routeObject: Record<string, any>) =>
            this.reqSchemaMap.set(routeObject.api_id, this.loadSchemaFromFile(routeObject.validation_schema))
        )
    }

    private loadSchemaFromFile(filename: string): any {
        const filePath = process.cwd() + `${this.schemaBasePath}schemas/` + filename;
        const fileContent = fs.readFileSync(filePath, "utf8");
        return JSON.parse(fileContent);
    }

    private getReqSchema(apiId: string): any {
        return this.reqSchemaMap.get(apiId);
    }
}
