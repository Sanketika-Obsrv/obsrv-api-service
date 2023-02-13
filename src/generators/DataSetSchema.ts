import { inferSchema } from "@jsonhero/schema-infer";
import _ from "lodash";
import { ISchemaGenerator } from "../models/DatasetModels";
import { ConflictTypes, DataSetSchemaResponse, SuggestionsTemplate } from "../models/SchemaModels";
import constants from "../resources/constants.json";
import { DataSetSuggestionService } from "./SchemaSuggestionService";
var jsonMerger = require("json-merger");

export class DataSetSchema implements ISchemaGenerator {
    private dataset: string;

    constructor(dataset: string, config: Map<string, any>) {
        this.dataset = dataset
    }

    generate(sample: Map<string, any>[]): any {
        const generatedSchema: Map<string, any>[] = _.map(sample, (value): any => inferSchema(value).toJSONSchema())
        return this.process(generatedSchema)
    }

    process(schemas: Map<string, any>[]): DataSetSchemaResponse {
        const suggestionService = new DataSetSuggestionService(schemas)
        const conflicts: ConflictTypes[] = suggestionService.findConflicts()
        const mergedSchema: Map<string, any> = this.mergeSchema(schemas)
        const updatedSchema = this.resolveConflicts(mergedSchema, conflicts)
        const suggestionTemplate: SuggestionsTemplate[] = suggestionService.createSuggestionTemplate(conflicts)
        const suggestedConfig = suggestionService.suggestConfig(conflicts)
        return <DataSetSchemaResponse>{ "schema": updatedSchema, "suggestions": suggestionTemplate, "configurations": suggestedConfig }
    }

    private mergeSchema(schema: Map<string, any>[]): Map<string, any> {
        return jsonMerger.mergeObjects(schema);
    }

    private resolveConflicts(schema: any, updateProps: ConflictTypes[]): any {
        updateProps.forEach((value: ConflictTypes) => {
            if (!_.isEmpty(value.schema) || !_.isEmpty(value.required)) {
                switch (value.schema.type || value.required.type) {
                    case constants.SCHEMA_RESOLUTION_TYPE.DATA_TYPE:
                        return this.updateSchemaDataTypes(schema, value)
                    case constants.SCHEMA_RESOLUTION_TYPE.REQUIRED_TYPE:
                        return this.updateSchemaRequiredProp(schema, value)
                    default:
                        console.warn("Unsupported Conflict Type")
                        break;
                }
            }else{console.info(`Conflicts not found ${JSON.stringify(value)}`)}
        }) 
        return schema
    }

    private updateSchemaDataTypes(schema: any, value: ConflictTypes): any {
        return _.set(schema, `${value.absolutePath}.type`, value.schema.resolution.dataType);
    }

    private updateSchemaRequiredProp(schema: any, value: ConflictTypes): any {
        const subStringArray: string[] = _.split(value.absolutePath, '.');
        const subString: string = _.join(_.slice(subStringArray, 0, subStringArray.length - 2), '.');
        const path: string = _.isEmpty(subString) ? "required" : `${subString}.required`
        const requiredList: string[] = _.get(schema, path)
        const newProperty: string = value.required.property
        value.required.resolution.required ? _.concat(_.get(schema, path), value.required.property) : _.pull(requiredList, newProperty)
        return _.set(schema, path, _.uniq(requiredList))
    }

}