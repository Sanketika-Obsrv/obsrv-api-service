import _ from "lodash";
import { Conflict, ConflictTypes, FlattenSchema, Occurance } from "../../types/SchemaModel";
import constants from "./Constants.json";
export class SchemaAnalyser {
    private transformationCols = ["email", "creditcard", "ipv4", "ipv6"]
    private dateFormatCols = ["date", "date-time"]
    private cardinalCols = ["uuid"]

    private schemas: Map<string, any>[];
    private minimumSchemas = 1


    constructor(schemas: Map<string, any>[]) {
        this.schemas = schemas;
    }

    /**
     * Method to analyse the schema
     */
    public analyseSchema(): ConflictTypes[] {
        return this.findConflicts()
    }

    private findConflicts(): ConflictTypes[] {
        const result: FlattenSchema[] = _.flatten(this.schemas.map(element => {
            return this.flattenSchema(new Map(Object.entries(element)));
        }))
        const conflicts = Object.entries(_.groupBy(result, "path")).map(([, value]) => {
            return this.getSchemaConflictTypes(this.getOccurance(value))
        })
        return _.filter(conflicts, obj => (!_.isEmpty(obj.schema) || !_.isEmpty(obj.required) || !_.isEmpty(obj.formats)))
    }

    /**
     * Retruns possible conflicts types
     *  1. data type conflicts
     *  2. Data format conflicts
     *  3. Optional property conflicts 
     */
    private getSchemaConflictTypes(occuranceObj: Occurance): ConflictTypes {
        const absolutePath = _.head(_.keysIn(occuranceObj.absolutePath))
        const updatedPath = absolutePath ? _.replace(absolutePath, "$.", "") : "";
        let schemaConflicts = this.findDataTypeConflicts(occuranceObj,)
        const requiredConflicts = (_.size(this.schemas) > this.minimumSchemas) ? this.findOptionalPropConflicts(occuranceObj) : {}
        const formatConflict = this.findFormatConflicts(occuranceObj)
        if (_.size(_.keys(schemaConflicts)) > 0) {
            schemaConflicts = { ...schemaConflicts, path: updatedPath }
        }
        return <ConflictTypes>{ "schema": schemaConflicts, "required": requiredConflicts, "formats": formatConflict, "absolutePath": updatedPath }
    }

    /**
     * Method to get the data type conflicts
     */
    private findDataTypeConflicts(occurance: Occurance): Conflict {
        if (_.includes(_.keys(occurance.dataType), "null") && _.size(occurance.dataType) === 1) {
            return {
                type: constants.SCHEMA_RESOLUTION_TYPE.NULL_FIELD,
                // Should be used only to return the name of field instead of path
                // property: Object.keys(occurance.property)[0],
                property: _.replace(Object.keys(occurance.path)[0], "$.", ""),
                conflicts: occurance.dataType,
                resolution: { "value": occurance.dataType, "type": constants.SCHEMA_RESOLUTION_TYPE.NULL_FIELD },
                values: _.keys(occurance.dataType),
                severity: constants.SEVERITY["MUST-FIX"],
                path: _.replace(Object.keys(occurance.absolutePath)[0], "$.", ""),
            }
        }
        const minimumOccurance = 1
        if (_.size(occurance.dataType) > minimumOccurance) {
            const isUnresolvable: boolean = _.uniq(_.values(occurance.dataType)).length === 1;
            const highestValueKey = !isUnresolvable ? Object.keys(occurance.dataType).reduce((a, b) => occurance.dataType[a] > occurance.dataType[b] ? a : b) : undefined
            return {
                type: constants.SCHEMA_RESOLUTION_TYPE.DATA_TYPE,
                property: _.replace(Object.keys(occurance.path)[0], "$.", ""),
                conflicts: occurance.dataType,
                resolution: { "value": highestValueKey, "type": constants.SCHEMA_RESOLUTION_TYPE.DATA_TYPE },
                values: _.without(_.keys(occurance.dataType), "null"),
                severity: constants.SEVERITY["MUST-FIX"],
                path: _.replace(Object.keys(occurance.absolutePath)[0], "$.", ""),
            }
        } else { return <Conflict>{} }
    }

    /**
     * Method to get the format type conflicts
     * 
     */
    private findFormatConflicts(occurance: Occurance): Conflict {
        const filteredFormat = _.omit(occurance.format, "undefined")
        const formats = _.concat(this.transformationCols, this.dateFormatCols, this.cardinalCols, ["uri"]);
        if (!_.isEmpty(filteredFormat)) {
            const formatName = _.filter(formats, f => _.has(filteredFormat, f));
            const suggestedFormat = this.idenfityFormat(formatName[0])
            return {
                type: formatName[0],
                property: _.replace(Object.keys(occurance.path)[0], "$.", ""),
                conflicts: filteredFormat,
                resolution: { "value": formatName, "type": suggestedFormat.type },
                values: _.keys(filteredFormat),
                severity: suggestedFormat.severity || "",
                path: _.replace(Object.keys(occurance.absolutePath)[0], "$.", ""),
            }
        } else { return <Conflict>{} }

    }


    private idenfityFormat(value: string) {
        if (_.includes(this.transformationCols, value)) {
            return { type: "TRANSFORMATION", "severity": "LOW" };
        } else if (_.includes(this.dateFormatCols, value)) {
            return { type: "INDEX", "severity": "LOW" };
        } else if (_.includes(this.cardinalCols, value)) {
            return { type: "DEDUP", "severity": "LOW" };
        } else {
            return {};
        }
    }

    /**
     * 
     */
    private findOptionalPropConflicts(occurance: Occurance): Conflict {
        const maxOccurance = 1
        const requiredCount = _.map(occurance.property, (value) => {
            return value
        })[0]

        const highestValueKey = Boolean(Object.keys(occurance.isRequired).reduce((a, b) => occurance.isRequired[a] > occurance.isRequired[b] ? a : b))
        const isPropertyRequired = requiredCount <= maxOccurance ? false : true
        if (highestValueKey != isPropertyRequired) {
            return {
                type: constants.SCHEMA_RESOLUTION_TYPE.OPTIONAL_TYPE,
                property: Object.keys(occurance.property)[0],
                conflicts: occurance.property,
                resolution: { "value": (isPropertyRequired), "type": "OPTIONAL" },
                values: [true, false],
                severity: "MEDIUM",
                path: _.replace(Object.keys(occurance.absolutePath)[0], "$.", ""),
            }
        }
        else { return <Conflict>{} }

    }

    /**
     *
     * Method to get the occurance of the given key from the given object 
     */
    private getOccurance(arrayOfObjects: object[]): Occurance {
        const result = _(arrayOfObjects).flatMap(obj => _.toPairs(obj)).groupBy(([key]) => key)
            .mapValues(group => _.countBy(group, ([, value]) => value)).value();
        return { property: result.property, dataType: result.dataType, isRequired: result.isRequired, path: result.path, absolutePath: result.absolutePath, format: result.formate };
    }

    /**
     * Method to iterate over the schema object in a recursive and flatten the required properties
     */
    public flattenSchema(sample: Map<string, any>): FlattenSchema[] {
        const array: any[] = [];
        const recursive = (data: any, path: string, requiredProps: string[], schemaPath: string) => {
            _.map(data, (value, key) => {
                let isMultipleTypes = "";
                if (_.has(value, "anyOf")) isMultipleTypes = "anyOf";
                if (_.has(value, "oneOf")) isMultipleTypes = "oneOf";
                if (_.isPlainObject(value) && (_.has(value, "properties"))) {
                    array.push(this._flattenSchema(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value["format"]))
                    recursive(value["properties"], `${path}.${key}`, value["required"], `${schemaPath}.properties.${key}`);
                } else if (_.isPlainObject(value)) {
                    if (value.type === "array") {
                        array.push(this._flattenSchema(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value["format"]))
                        if (_.has(value, "items") && _.has(value["items"], "properties")) {
                            recursive(value["items"]["properties"], `${path}.${key}[*]`, value["items"]["required"], `${schemaPath}.properties.${key}.items`);
                        }
                    } else if (isMultipleTypes != "") {
                        array.push(this._flattenSchema(key, value[isMultipleTypes][0].type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value["format"]))
                        array.push(this._flattenSchema(key, value[isMultipleTypes][1].type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value["format"]))
                    } else {
                        array.push(this._flattenSchema(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value["format"]))
                    }
                }
            })
        }
        recursive(sample.get("properties"), "$", sample.get("required"), "$")
        return array
    }

    private _flattenSchema(expr: string, objType: string, isRequired: boolean, path: string, schemaPath: string, formate: string): FlattenSchema {
        return <FlattenSchema>{ "property": expr, "dataType": objType, "isRequired": isRequired, "path": path, "absolutePath": schemaPath, "formate": formate }
    }

}
