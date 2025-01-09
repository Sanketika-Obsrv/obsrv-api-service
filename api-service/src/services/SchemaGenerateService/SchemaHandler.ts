import _ from "lodash";
import { ConflictTypes, SuggestionsTemplate } from "../../types/SchemaModel";
import { SchemaMerger } from "./SchemaMerger";
import { SchemaAnalyser } from "./SchemaAnalyser";
import DataMappings from "./SchemaMapping.json";

export const dataMappingPaths = {
    "string": "text.store_format.string.jsonSchema",
    "date-time": "text.store_format.date-time.jsonSchema",
    "date": "text.store_format.date.jsonSchema",
    "boolean": "boolean.store_format.boolean.jsonSchema",
    "integer": "number.store_format.integer.jsonSchema",
    "number": "number.store_format.number.jsonSchema",
    "object": "object.store_format.object.jsonSchema",
    "array": "array.store_format.array.jsonSchema",
}

export class SchemaHandler {
    private typeToMethod = {
        required: this.updateRequiredProp.bind(this),
        datatype: this.updateDataTypes.bind(this),
        suggestions: this.setSuggestions.bind(this),
        setNulltype: this.setNulltype.bind(this)
    }

    public process(schema: Map<string, any>[]): ConflictTypes[] {
        const schemaAnalyser = new SchemaAnalyser(schema)
        return schemaAnalyser.analyseSchema()
    }

    public merge(schema: any): any {
        const schemaMerger = new SchemaMerger()
        return schemaMerger.mergeSchema(schema)
    }

    public update(schema: any, property: any, type: keyof typeof this.typeToMethod) {
        const method = this.typeToMethod[type];
        return method(schema, property);
    }

    private updateDataTypes(schema: any, conflict: ConflictTypes): any {
        const { absolutePath, schema: { resolution } } = conflict;
        return _.set(schema, `${absolutePath}`, {
            ...schema[absolutePath],
            ...{
                type: resolution.value || _.first(conflict.schema.values),
                oneof: conflict.schema.values.map(key => {
                    const storeFormat = _.get(dataMappingPaths, key);
                    return { type: _.get(DataMappings, storeFormat) }
                }),
            }
        });
    }

    private setNulltype(schema: any, conflict: ConflictTypes): any {
        const { absolutePath } = conflict;
        const dataTypes: any = [];
        _.forEach(DataMappings, (valueItem) => {
            _.forEach(_.get(valueItem, "store_format"), (subValue) => {
                if (!_.find(dataTypes, ["type", subValue["jsonSchema"]]))
                    dataTypes.push({ type: subValue["jsonSchema"] })
            })
        });
        const arrivalDataTypes: any = _.keys(DataMappings).map((key: any) => ({ type: key }));

        _.set(schema, `${absolutePath}.type`, "null");
        _.set(schema, `${absolutePath}.arrivalOneOf`, arrivalDataTypes);
        return _.set(schema, `${absolutePath}.oneof`, dataTypes);
    }

    private updateRequiredProp(schema: any, value: ConflictTypes): any {
        const absolutePath = value.absolutePath.replace(value.required.property, value.required.property.replace(".", "$"))
        const subStringArray: string[] = _.split(absolutePath, ".");
        const subString: string = _.join(_.slice(subStringArray, 0, subStringArray.length - 2), ".");
        const path: string = _.isEmpty(subString) ? "required" : `${subString}.required`
        const requiredList: string[] = _.get(schema, path)
        const newProperty: string = value.required.property
        value.required.resolution.value ? _.concat(_.get(schema, path), value.required.property) : _.pull(requiredList, newProperty)
        return _.set(schema, path, _.uniq(requiredList))
    }

    private getArrivalSuggestions(schema: any, fieldData: any, property: any, type: string) {
        const arrivalSuggestions: any = [];
        const types = _.get(fieldData, type);
        types && types.map((item: any) => {
            const storeFormat = _.get(dataMappingPaths, item.type);
            arrivalSuggestions.push({ type: _.first(storeFormat.split(".")) });
        })
        if (arrivalSuggestions.length > 0)
            _.set(schema, `${property}.arrivalOneOf`, arrivalSuggestions);
        return;
    }

    private getArrivalFormat(schema: any, fieldData: any, property: any, type: string) {
        const types = _.get(fieldData, type)
        const propType = _.get(fieldData, "type")
        if(types){
            const storeFormat = _.get(dataMappingPaths, propType);
            _.set(schema, `${property}.arrival_format`, _.first(storeFormat.split(".")));
            _.set(schema, `${property}.data_type`, _.get(DataMappings, storeFormat));
        }
        return;
    }

    private setSuggestions(schema: any, suggestedTemplate: SuggestionsTemplate[]): any {
        suggestedTemplate && suggestedTemplate.map(({ property, suggestions }) => {
            const fieldData = _.get(schema, property);
            _.set(schema, `${property}.suggestions`, suggestions);
            const arrivalConflictExists = _.filter(suggestions, (suggestion) => _.has(suggestion, "arrivalConflict"));
            switch (true) {
                // Add arrival conflicts if there is arrival conflict in suggestions
                case _.has(fieldData, "oneof") && arrivalConflictExists.length > 0:
                    return this.getArrivalSuggestions(schema, fieldData, property, "oneof")
                // Add arrival type if there are no arrival type conflicts
                case arrivalConflictExists.length === 0:
                    return this.getArrivalFormat(schema, fieldData, property, "oneof")
                default:
                    break;
            }
        });
        return schema;
    }

    private updateStoreType(schemaValue: any, dataType: string): any {
        const storeFormat = _.get(dataMappingPaths, dataType);
        if (storeFormat) {
            _.set(schemaValue, "arrival_format", _.first(storeFormat.split(".")));
            if (!_.get(schemaValue, "data_type")) _.set(schemaValue, "data_type", _.get(DataMappings, storeFormat));
        }
    }

    private checkForInvalidArray(value: any) {
        if (_.has(value, "items") && _.has(value, "properties"))
            _.unset(value, "properties");
    }

    private updateMappings(schema: Map<string, any>) {
        const recursive = (data: any) => {
            _.map(data, (value) => {
                if (_.isPlainObject(value)) {
                    if ((_.has(value, "properties"))) {
                        recursive(value["properties"]);
                    }
                    if (value.type === "array") {
                        if (_.has(value, "items") && _.has(value["items"], "properties")) {
                            recursive(value["items"]["properties"]);
                        }
                        if (_.has(value, "items") && _.has(value, "properties"))
                            this.checkForInvalidArray(value);
                        this.updateStoreType(value, _.get(value, "type"));
                    } else {
                        if (_.get(value, "type") === "string" && ["date-time", "date"].includes(_.get(value, "format"))) {
                            this.updateStoreType(value, _.get(value, "format"));
                        }
                        else {
                            this.updateStoreType(value, _.get(value, "type"));
                        }
                    }
                } else {
                    this.updateStoreType(value, _.get(value, "type"));
                }
            })
        }
        recursive(_.get(schema, "properties"))
    }

    public mapDataTypes(schema: any,): any {
        this.updateMappings(schema);
        return schema;
    }

}
