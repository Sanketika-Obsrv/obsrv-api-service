import { inferSchema } from "@jsonhero/schema-infer";
import httpStatus from "http-status";
import _ from "lodash";
import { SchemaGenerationException } from "../configs/exceptions/CustomExceptions";
import { DataSetConfig } from "../models/ConfigModels";
import { ISchemaGenerator } from "../models/DatasetModels";
import { ConflictTypes, DatasetSchemaConfig, DatasetSchemaResponse, SuggestionsTemplate } from "../models/SchemaModels";
import constants from "../resources/Constants.json";
import { SchemaSuggestion } from "./SchemaSuggestion";
var jsonMerger = require("json-merger");

export class DatasetSchema implements ISchemaGenerator {
  private dataset: string;
  private config: DatasetSchemaConfig;

  constructor(dataset: string, config: DatasetSchemaConfig) {
    this.dataset = dataset
    this.config = config
  }

  generate(sample: Map<string, any>[]): any {
    const { isBatch = false, extractionKey } = this.config;
    let schema = isBatch ? this.inferBatchSchema(sample, extractionKey) : this.inferSchema(sample);
    return this.process(schema);
  }

  process(schemas: Map<string, any>[]): DatasetSchemaResponse {
    const suggestionService = new SchemaSuggestion(schemas)
    const conflicts: ConflictTypes[] = suggestionService.findConflicts()
    const updatedSchema = this.resolveConflicts(this.mergeSchema(schemas), conflicts)
    const suggestionTemplate: SuggestionsTemplate[] = suggestionService.createSuggestionTemplate(conflicts)
    const suggestedConfig: DataSetConfig = suggestionService.suggestConfig(conflicts)
    return <DatasetSchemaResponse>{ "schema": updatedSchema, "suggestions": suggestionTemplate, "configurations": suggestedConfig }
  }

  private inferBatchSchema(sample: Map<string, any>[], extractionKey: string) {
    return _.flatMap(sample, (value) => {
      if (extractionKey) {
        const extracted = _.get(value, extractionKey);
        if (extracted) {
          return this.inferSchema(extracted);
        } else {
          throw new SchemaGenerationException('Unable to extract the batch data.', httpStatus.BAD_REQUEST);
        }
      } else {
        throw new SchemaGenerationException('Extraction key not found.', httpStatus.BAD_REQUEST);
      }
    })
  }

  private inferSchema(sample: any) {
    return _.map(sample, (value): any => inferSchema(value).toJSONSchema({ includeSchema: false }))
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
      } else { console.info(`Conflicts not found ${JSON.stringify(value)}`) }
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
