import { SchemaMerger } from "./SchemaMerger";
import _ from "lodash";
import { generateRollupSummary, generateSchemaPath, updateCardinalColumns } from "./SchemaGeneratorUtils";
import { FieldSchema, UniqueValues } from "../../types/SchemaModel";
export class SchemaCardinalityAnalyser {
    private sampleData: Record<string, any>[]
    private sampleSchema: Map<string, any>[]
    private schemaMerger: SchemaMerger
    private mergedSchema: FieldSchema
    private uniqueValues: UniqueValues
    constructor(sampleData: Record<string, any>[], sampleSchema: Map<string, any>[]) {
        this.sampleData = sampleData
        this.sampleSchema = sampleSchema
        this.schemaMerger = new SchemaMerger()
        this.mergedSchema = this.schemaMerger.mergeSchema(this.sampleSchema) || {}
        this.uniqueValues = {}
    }

    public analyse() {
        this.generateUniqueValues(this.sampleData, this.mergedSchema)
        return generateRollupSummary(this.uniqueValues)
    }

    private generateUniqueValues(data: any, schema: FieldSchema, currentPath = "") {
        if (!_.isUndefined(data) && !_.isUndefined(schema) && _.isArray(data)) {
            for (const item of data) {
                if (schema?.type === "object" && !_.isUndefined(schema.properties)) {
                    this.identifyCardinalColumns(item, schema.properties, currentPath);
                } else if (schema?.type === "array" && !_.isUndefined(schema.items)) {
                    this.generateUniqueValues(item, schema.items, currentPath);
                }
            }
        }
    }

    private identifyCardinalColumns(data: Record<string, any>, schema: any, currentPath: string) {
        if (!_.isUndefined(data) && !_.isUndefined(schema)) {
            for (const key of Object.keys(schema)) {
                const fieldSchema = schema[key]
                const path = generateSchemaPath(currentPath, key)
                if (fieldSchema?.type === "object") {
                    this.identifyCardinalColumns(data[key], fieldSchema.properties, path);
                } else if (fieldSchema?.type === "array") {
                    this.generateUniqueValues(data[key], fieldSchema.items || {}, `${path}[*]`);
                }
                updateCardinalColumns(data, fieldSchema, currentPath, key, this.uniqueValues)
            }
        }
    }
} 
