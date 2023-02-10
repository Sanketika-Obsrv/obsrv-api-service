import _ from "lodash";
import { SchemaSuggestionTemplate } from "../helpers/suggestions";
import { DataSetConfig } from "../models/ConfigModels";
import { Conflict, ConflictTypes, FlattenSchema, Occurance, Suggestion, SuggestionsTemplate } from "../models/SchemaModels";
import constants from "../resources/constants.json";
import { ConfigService } from "../services/ConfigService";
export class DataSetSuggestionService {
    private schemas: Map<string, any>[];
    private minimumSchemas: number = 1

    constructor(schemas: Map<string, any>[]) {
        this.schemas = schemas;
    }

    public findConflicts(): ConflictTypes[] {
        return this.analyseSchema()
    }

    public suggestConfig(): DataSetConfig {
        const config: DataSetConfig = new ConfigService().suggestConfig()
        return config
    }

    private analyseSchema(): ConflictTypes[] {
        const result: FlattenSchema[] = _.flatten(this.schemas.map(element => {
            return this.flattenSchema(new Map(Object.entries(element)));
        }))
        const conflicts = Object.entries(_.groupBy(result, 'path')).map(([key, value]) => {
            return this.getSchemaConflictTypes(this.countKeyValuePairs(value, key))
        })
        return _.filter(conflicts, obj => (!_.isEmpty(obj.schema) || !_.isEmpty(obj.required) || !_.isEmpty(obj.formats)))
    }

    private getSchemaConflictTypes(occuranceObj: Occurance): ConflictTypes {
        const absolutePath = _.head(_.keysIn(occuranceObj.absolutePath))
        const updatedPath = absolutePath ? _.replace(absolutePath, "$.", "") : "";
        const schemaConflicts = this.getDataTypeConflict(occuranceObj,)
        const requiredConflicts = (_.size(this.schemas) > this.minimumSchemas) ? this.getRequiredPropConflict(occuranceObj) : {}
        const formatConflict = this.getPropertyFormateConflicts(occuranceObj)
        return <ConflictTypes>{ "schema": schemaConflicts, "required": requiredConflicts, "formats": formatConflict, "absolutePath": updatedPath }
    }

    private getDataTypeConflict(occurance: Occurance): Conflict {
        const minimumOccurance: number = 1
        if (_.size(occurance.dataType) > minimumOccurance) {
            const highestValueKey = Object.keys(occurance.dataType).reduce((a, b) => occurance.dataType[a] > occurance.dataType[b] ? a : b)
            return { type: constants.SCHEMA_RESOLUTION_TYPE.DATA_TYPE, property: Object.keys(occurance.property)[0], conflicts: occurance.dataType, resolution: { "dataType": highestValueKey } }
        } else { return <Conflict>{} }
    }

    private getPropertyFormateConflicts(occurance: Occurance): Conflict {
        const filteredFormat = _.omit(occurance.format, "undefined")
        const formats = ["date", "date-time", "uuid", "uri", "ipv4", "ipv6", "email", "creditcard"]
        if (!_.isEmpty(filteredFormat)) {
            const formatname = _.filter(formats, f => _.has(filteredFormat, f));
            return { type: constants.SCHEMA_RESOLUTION_TYPE.FORMATE_TYPE, property: Object.keys(occurance.property)[0], conflicts: filteredFormat, resolution: { "format": formatname } }
        } else { return <Conflict>{} }

    }

    private getRequiredPropConflict(occurance: Occurance): Conflict {
        const maxOccurance: number = 1
        const requiredCount = _.map(occurance.property, (value, key) => {
            return value
        })[0]

        const highestValueKey = Boolean(Object.keys(occurance.isRequired).reduce((a, b) => occurance.isRequired[a] > occurance.isRequired[b] ? a : b))
        const isPropertyRequired = requiredCount <= maxOccurance ? false : true
        if (highestValueKey != isPropertyRequired) {
            return { type: constants.SCHEMA_RESOLUTION_TYPE.REQUIRED_TYPE, property: Object.keys(occurance.property)[0], conflicts: occurance.property, resolution: { "required": (isPropertyRequired) } }
        }
        else { return <Conflict>{} }

    }

    public createSuggestionTemplate(sample: any[]): SuggestionsTemplate[] {
        return _.map(sample, (value, key) => {
            const dataTypeSuggestions = this.getRequiredMessageTemplate(value["required"])
            const requiredSuggestions = this.getSchemaMessageTempalte(value["schema"])
            const formatSuggestions = this.getPropertyFormatTemplate(value["formats"])
            return <SuggestionsTemplate>{
                "property": _.replace(value.absolutePath, /properties./g, ""),
                "suggestions": _.reject([dataTypeSuggestions, requiredSuggestions, formatSuggestions], _.isEmpty)
            }
        })
    }

    private getSchemaMessageTempalte(schema: any): Suggestion {
        if (_.isEmpty(schema)) return <Suggestion>{}
        const conflictMessage = SchemaSuggestionTemplate.getSchemaDataTypeMessage(schema["conflicts"], schema["property"])
        return <Suggestion>{
            message: conflictMessage, advice: SchemaSuggestionTemplate.TEMPLATES.SCHEMA_SUGGESTION.CREATE.DATATYPE_PROPERTY.ADVICE,
            resolutionType: constants.SCHEMA_RESOLUTION_TYPE.DATA_TYPE, priority: SchemaSuggestionTemplate.TEMPLATES.SCHEMA_SUGGESTION.CREATE.DATATYPE_PROPERTY.PRIORITY,
        }
    }

    private getPropertyFormatTemplate(schema: any): Suggestion {
        if (_.isEmpty(schema)) return <Suggestion>{}
        const conflictMessage = SchemaSuggestionTemplate.getSchemaFormatMessage(schema["conflicts"], schema["property"])
        const adviceObj = SchemaSuggestionTemplate.getSchemaFormatAdvice(schema["conflicts"])
        return <Suggestion>{ message: conflictMessage, advice: adviceObj.advice, resolutionType: constants.SCHEMA_RESOLUTION_TYPE.FORMATE_TYPE, priority: adviceObj.priority }
    }

    private getRequiredMessageTemplate(schema: any): Suggestion {
        if (_.isEmpty(schema)) return <Suggestion>{}
        const conflictMessage = SchemaSuggestionTemplate.getSchemaRequiredTypeMessage(schema["conflicts"], schema["property"])
        return <Suggestion>{
            message: conflictMessage, advice: SchemaSuggestionTemplate.TEMPLATES.SCHEMA_SUGGESTION.CREATE.REQUIRED_PROPERTY.ADVICE,
            resolutionType: constants.SCHEMA_RESOLUTION_TYPE.REQUIRED_TYPE, priority: SchemaSuggestionTemplate.TEMPLATES.SCHEMA_SUGGESTION.CREATE.REQUIRED_PROPERTY.PRIORITY,
        }
    }

    private countKeyValuePairs(arrayOfObjects: object[], key: string): Occurance {
        const result = _(arrayOfObjects)
            .flatMap(obj => _.toPairs(obj))
            .groupBy(([key, value]) => key)
            .mapValues(group => _.countBy(group, ([key, value]) => value))
            .value();
        return { property: result.property, dataType: result.dataType, isRequired: result.isRequired, path: result.path, absolutePath: result.absolutePath, format: result.formate };
    }

    private flattenSchema(sample: Map<string, any>): FlattenSchema[] {
        let array = new Array();
        const recursive = (data: any, path: string, requiredProps: string[], schemaPath: string) => {
            _.forEach(data, (value, key) => {
                if (_.isPlainObject(value) && (_.has(value, 'properties'))) {
                    array.push(this.flattenSchem(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value['format']))
                    recursive(value['properties'], `${path}.${key}`, value['required'], `${schemaPath}.properties.${key}`);
                } else {
                    if (_.isPlainObject(value)) {
                        if (value.type === 'array') {
                            array.push(this.flattenSchem(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value['format']))
                            if (_.has(value, 'items') && _.has(value["items"], 'properties')) {
                                recursive(value["items"]['properties'], `${path}.${key}[*]`, value["items"]['required'], `${schemaPath}.properties.items.${key}`);
                            } else {
                                array.push(this.flattenSchem(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value['format']))
                            }
                        } else {
                            array.push(this.flattenSchem(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value['format']))
                        }
                    }
                }
            })
        }
        recursive(sample.get("properties"), "$", sample.get("required"), "$")
        return array
    }

    private flattenSchem(expr: string, objType: string, isRequired: boolean, path: string, schemaPath: string, formate: string): FlattenSchema {
        return <FlattenSchema>{ "property": expr, "dataType": objType, "isRequired": isRequired, "path": path, "absolutePath": schemaPath, "formate": formate }
    }

}
