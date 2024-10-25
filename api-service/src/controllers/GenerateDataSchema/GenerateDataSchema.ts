import httpStatus from "http-status";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { Request, Response } from "express";
import { DataSetConfig, DatasetSchemaResponse, DatasetSchemeRequest } from "../../types/SchemaModel";
import { obsrvError } from "../../types/ObsrvError";
import { schemaValidation } from "../../services/ValidationService";
import DataSchemaValidation from "./RequestValidationSchema.json"
import _ from "lodash";
import constants from "../../services/SchemaGenerateService/Constants.json";
import { SchemaInference } from "../../services/SchemaGenerateService/DataSchemaService";
import { SchemaArrayValidator } from "../../services/SchemaGenerateService/SchemaArrayValidator";
import { SchemaHandler } from "../../services/SchemaGenerateService/SchemaHandler";
import DataMappings from "../../services/SchemaGenerateService/SchemaMapping.json";
import { SchemaCardinalityAnalyser } from "../../services/SchemaGenerateService/SchemaCardinalityAnalyser";
import { SuggestionTemplate } from "../../services/SchemaGenerateService/SuggestionTemplate";
import { ConfigSuggestor } from "../../services/SchemaGenerateService/ConfigSuggester";

let rollupInfo = {}

const validateRequest = async (req: Request) => {

    const isRequestValid: Record<string, any> = schemaValidation(req.body, DataSchemaValidation)
    if (!isRequestValid.isValid) {
        throw obsrvError("", "DATA_SCHEMA_INVALID_INPUT", isRequestValid.message, "BAD_REQUEST", 400)
    }

}

const dataSchema = async (req: Request, res: Response) => {

    await validateRequest(req)
    const request = <DatasetSchemeRequest>req.body.request
    const dataSchemaSpec = schemaGenerate(request.data, request.config)
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: dataSchemaSpec });

}

const schemaGenerate = (sample: Map<string, any>[], config: Record<string, any>): any => {
    const { isBatch = false, extractionKey, dataset } = config;
    const isJsonSchema = checkJsonSchema(_.head(sample) || new Map<string, any>());
    const schemaInference = new SchemaInference();
    const schemaArrayValidator = new SchemaArrayValidator();
    if (isJsonSchema) {
        const result = process(sample, dataset)
        result.schema = removeNonIndexColumns(result.schema)
        result.schema = removeFormats(result.schema)
        return result
    } else {
        // eslint-disable-next-line
        let { schema, removedKeys } = isBatch ? schemaInference.inferBatchSchema(<Map<string, any>[]>sample, extractionKey) : schemaInference.inferSchema(sample);
        schema = schemaArrayValidator.validate(schema)
        const schemaCardinalityAnalyser = new SchemaCardinalityAnalyser(sample, schema)
        rollupInfo = schemaCardinalityAnalyser.analyse()
        const result = process(schema, dataset)
        result.schema = removeNonIndexColumns(result.schema)
        result.schema = removeFormats(result.schema)
        !_.isEmpty(removedKeys) && _.set(result, "removedKeys", removedKeys)
        return result
    }
}

const process = (schemas: Map<string, any>[], dataset: string): DatasetSchemaResponse => {
    const schemaHandler = new SchemaHandler();
    const suggestionTemplate = new SuggestionTemplate();
    const configSuggestor = new ConfigSuggestor(dataset);
    const mergedSchema = schemaHandler.merge(schemas)
    const report = schemaHandler.process(schemas)
    const resolvedSchema = resolveConflicts(mergedSchema, report)
    const suggestionTemplates = suggestionTemplate.createSuggestionTemplate(report)
    const schema = schemaHandler.update(resolvedSchema, suggestionTemplates, "suggestions")
    const suggestedConfig: DataSetConfig = configSuggestor.suggestConfig(report, rollupInfo)
    const updatedSchema = schemaHandler.mapDataTypes(schema)
    _.set(updatedSchema, "additionalProperties", true);
    return <DatasetSchemaResponse>{ "schema": updatedSchema, "configurations": suggestedConfig, "dataMappings": DataMappings }
}


const checkJsonSchema = (sample: Map<string, any>): boolean => {
    const schemaProps = ["$id", "$schema", "$ref"]
    return Object.keys(sample).some(key => schemaProps.includes(key));
}

const removeNonIndexColumns = (schema: any) => {
    if (schema.properties) {
        Object.entries(schema.properties).map(([, property]: any) => {
            _.unset(schema, "required");
            removeNonIndexColumns(property)
        });
    } else if (schema.items) {
        removeNonIndexColumns(schema.items)
    }
    if (Array.isArray(schema.required) && schema.required.length === 0) {
        _.unset(schema, "required");
    }
    return schema
}

const removeFormats = (schema: any) => {
    if (schema.properties) {
        Object.entries(schema.properties).map(([, property]: any) => {
            // Removing format to avoid schema validation issues
            const isDateTypeField = ["date-time", "date", "epoch"].includes((property as any).format);
            if (isDateTypeField && _.get(property, "data_type") === "string") {
                _.set(property, "data_type", _.get(property, "format"));
            } else if (isDateTypeField && _.get(property, "data_type") === "integer") {
                _.set(property, "data_type", "epoch");
            }
            _.unset(property, "format");
            removeFormats(property)
        });
    } else if (schema.items) {
        _.unset(schema.items, "format");
        removeFormats(schema.items)
    }
    return schema
}

const resolveConflicts = (schema: any, updateProps: any): any => {
    const schemaHandler = new SchemaHandler();
    updateProps.map((value: any) => {
        if (!_.isEmpty(value.schema) || !_.isEmpty(value.required)) {
            switch (value.schema.type || value.required.type) {
                case constants.SCHEMA_RESOLUTION_TYPE.DATA_TYPE:
                    return schemaHandler.update(schema, value, "datatype")
                case constants.SCHEMA_RESOLUTION_TYPE.NULL_FIELD:
                    return schemaHandler.update(schema, value, "setNulltype")
                case constants.SCHEMA_RESOLUTION_TYPE.OPTIONAL_TYPE:
                    return schemaHandler.update(schema, value, "required")
                default:
                    console.warn("Unsupported Conflict Type")
                    break;
            }
        } else { console.info(`Conflicts not found ${JSON.stringify(value)}`) }
    })
    return schema
}


export default dataSchema;