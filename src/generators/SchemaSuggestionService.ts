import _ from "lodash";
import { SchemaSuggestionTemplate } from "../helpers/suggestions";
import { ConflictSchema, DataSetConfig, Suggestions } from "../models/DatasetModels";
import { ConfigService } from "../services/ConfigService";
export class DataSetSuggestionService {
    private schemas: Map<string, any>[];
    constructor(schemas: Map<string, any>[]) {
        this.schemas = schemas;
    }

    public suggestSchema(): Suggestions[] {
        return this.schemaComparision()
    }

    public suggestConfig(): any {
        const config: DataSetConfig = new ConfigService().suggestConfig()
        return config
    }

    private schemaComparision(): Suggestions[] {
        const result = this.schemas.map(element => {
            const sample = new Map(Object.entries(element));
            const response = this.flattenSchema(sample);
            return response
        })
        var groupedSchema = _.groupBy(_.flatten(result), 'path')
        const conflicts = Object.entries(groupedSchema).map(([key, value]) => {
            return this.getSchemaConflictTypes(this.countKeyValuePairs(value, key))
        })
        return _.filter(conflicts, obj => (!_.isEmpty(obj.schema) || !_.isEmpty(obj.required)))
    }

    public getSchemaConflictTypes(occuranceObj: any): Suggestions {
        const propertyFullPath = _.head(_.keysIn(occuranceObj.fullPath))
        const updatedPath = propertyFullPath ? _.replace(propertyFullPath, "$.", "") : "";
        const schemaConflicts = this.getDataTypeConflict(occuranceObj,)
        const requiredConflicts = this.getRequiredPropConflict(occuranceObj)
        return { "schema": schemaConflicts, "required": requiredConflicts, "fullPath": updatedPath }
    }

    private getDataTypeConflict(occurance: any): ConflictSchema {
        if (_.size(occurance.dataType) > 1) {
            const highestValueKey = Object.keys(occurance.dataType).reduce((a, b) => occurance.dataType[a] > occurance.dataType[b] ? a : b)
            return {
                type: "DATA_TYPE",
                property: Object.keys(occurance.property)[0],
                conflicts: occurance.dataType,
                resolution: { "dataType": highestValueKey },
            }
        } else {
            return <ConflictSchema>{}
        }


    }
    private getRequiredPropConflict(occurance: any): ConflictSchema {
        const requiredCount = _.map(occurance.property, (value, key) => {
            return value
        })[0]

        const highestValueKey = Boolean(Object.keys(occurance.isRequired).reduce((a, b) => occurance.required[a] > occurance.required[b] ? a : b))
        const isPropertyRequired = requiredCount <= 1 ? false : true
        if (highestValueKey != isPropertyRequired) {
            return {
                type: "REQUIRED_TYPE",
                property: Object.keys(occurance.property)[0],
                conflicts: occurance.property,
                resolution: { "required": (requiredCount <= 1 ? false : true) },
            }
        } else {
            return <ConflictSchema>{}
        }

    }

    public createSuggestionTemplate(sample: any[]): any[] {
        return _.map(sample, (value, key) => {
            const dataTypeSuggestions = this.getRequiredMessageTemplate(value["required"])
            const requiredSuggestions = this.getSchemaMessageTempalte(value["schema"])
            return {
                "property": value["fullPath"],
                "suggestions": _.reject([dataTypeSuggestions, requiredSuggestions], _.isEmpty)
            }
        })
    }

    private getSchemaMessageTempalte(schema: any) {
        if (_.isEmpty(schema)) return {}
        const conflictMessage = SchemaSuggestionTemplate.getSchemaDataTypeMessage(schema["conflicts"], schema["property"])
        return {
            message: conflictMessage,
            advice: SchemaSuggestionTemplate.TEMPLATES.SCHEMA_SUGGESTION.CREATE.DATATYPE_PROPERTY.ADVICE,
            resolutionType: "DATA_TYPE"
        }
    }

    private getRequiredMessageTemplate(schema: any) {
        if (_.isEmpty(schema)) return {}
        //const conflictMessage = `${SchemaSuggestionTemplate.TEMPLATES.SCHEMA_SUGGESTION.MESSAGE}, Property: "${schema["property"]}". appears to be Optional`
        const conflictMessage = SchemaSuggestionTemplate.getSchemaRequiredTypeMessage(schema["conflicts"], schema["property"])
        return {
            message: conflictMessage,
            advice: SchemaSuggestionTemplate.TEMPLATES.SCHEMA_SUGGESTION.CREATE.REQUIRED_PROPERTY.ADVICE,
            resolutionType: "REQUIRED_TYPE"
        }
    }

    public countKeyValuePairs(arrayOfObjects: object[], key: string) {
        return _(arrayOfObjects)
            .flatMap(obj => _.toPairs(obj))
            .groupBy(([key, value]) => key)
            .mapValues(group => _.countBy(group, ([key, value]) => value))
            .value();
    }

    private flattenSchema(sample: Map<string, any>): any[] {
        let array = new Array();
        const recursive = (data: any, path: string, requiredProps: string[], schemaPath: string) => {
            _.forEach(data, (value, key) => {
                if (_.isPlainObject(value) && (_.has(value, 'properties'))) {
                    array.push(this.createSpecObj(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`))
                    recursive(value['properties'], `${path}.${key}`, value['required'], `${schemaPath}.properties.${key}`);
                } else {
                    if (_.isPlainObject(value)) {
                        if (value.type === 'array') {
                            array.push(this.createSpecObj(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`))
                            if (_.has(value, 'items') && _.has(value["items"], 'properties')) {
                                recursive(value["items"]['properties'], `${path}.${key}[*]`, value["items"]['required'], `${schemaPath}.properties.items.${key}`);
                            } else {
                                array.push(this.createSpecObj(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`))
                            }
                        } else {
                            array.push(this.createSpecObj(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`))
                        }
                    }
                }
            })
        }
        recursive(sample.get("properties"), "$", sample.get("required"), "$")
        return array
    }

    private createSpecObj(expr: string, objType: string, isRequired: boolean, path: string, schemaPath: string): any {
        return {
            "property": expr,
            "dataType": objType,
            "isRequired": isRequired,
            "path": path,
            "fullPath": schemaPath

        }
    }

}
