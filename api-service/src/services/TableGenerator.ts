import _ from "lodash";
import { rawIngestionSpecDefaults } from "../configs/IngestionConfig";
import { datasetService } from "./DatasetService";

class BaseTableGenerator {

    /**
     * Method to flatten a json schema - extract all properties using jsonpath notation
     * 
     * @param dataSchema 
     * @returns properties Record<string, any>[]
     */
    flattenSchema = (dataSchema: Record<string, any>, type: string): Record<string, any>[] => {

        const properties: Record<string, any>[] = []
        const flatten = (schema: Record<string, any>, prev: string | undefined, prevExpr: string | undefined) => {
            _.mapKeys(schema, function (value, parentKey) {
                const newKey = (prev) ? type === "druid" ? _.join([prev, parentKey], ".") : _.replace(_.join([prev, parentKey], "_"), /\./g, "_") : parentKey;
                const newExpr = (prevExpr) ? _.join([prevExpr, ".['", parentKey, "']"], "") : _.join(["$.['", parentKey, "']"], "");
                switch (value["type"]) {
                    case "object":
                        flatten(_.get(value, "properties"), newKey, newExpr);
                        break;
                    case "array":
                        if (type === "druid" && _.get(value, "items.type") == "object" && _.get(value, "items.properties")) {
                            _.mapKeys(_.get(value, "items.properties"), function (value, childKey) {
                                const objChildKey = type === "druid" ? _.join([newKey, childKey], ".") : _.replace(_.join([prev, childKey], "_"), /\./g, "_")
                                properties.push(_.merge(_.pick(value, ["type", "arrival_format", "is_deleted"]), { expr: _.join([newExpr, "[*].['", childKey, "']"], ""), name: objChildKey, data_type: "array" }))
                            })
                        } else {
                            properties.push(_.merge(_.pick(value, ["arrival_format", "data_type", "is_deleted"]), { expr: newExpr + "[*]", name: newKey, type: _.get(value, "items.type") }))
                        }
                        break;
                    default:
                        properties.push(_.merge(_.pick(value, ["type", "arrival_format", "data_type", "is_deleted"]), { expr: newExpr, name: newKey }))
                }
            });
        }
        flatten(_.get(dataSchema, "properties"), undefined, undefined)
        return properties
    }

    /**
     * Get all fields of a dataset merging schema fields, transformations and denorm fields
     * 
     * @param data_schema 
     * @param transformations_config 
     * @param denorm_config 
     * @returns Promise<Record<string, any>[]>
     */
    getAllFields = async (dataset: Record<string, any>, type: string): Promise<Record<string, any>[]> => {

        const { data_schema, denorm_config, transformations_config } = dataset
        let dataFields = this.flattenSchema(data_schema, type);
        if (!_.isEmpty(denorm_config.denorm_fields)) {
            for (const denormField of denorm_config.denorm_fields) {
                const denormDataset: any = await datasetService.getDataset(denormField.dataset_id, ["data_schema"], true);
                const properties = this.flattenSchema(denormDataset.data_schema, type);
                const transformProps = _.map(properties, (prop) => {
                    _.set(prop, "name", _.join([denormField.denorm_out_field, prop.name], "."));
                    _.set(prop, "expr", _.replace(prop.expr, "$", "$." + `['${denormField.denorm_out_field}']`));
                    return prop;
                });
                dataFields.push(...transformProps);
            }
        }
        if (!_.isEmpty(transformations_config)) {
            const transformationFields = _.map(transformations_config, (tf) => ({
                expr: "$." + `['${tf.field_key}']`,
                name: tf.field_key,
                data_type: tf.transformation_function.datatype,
                arrival_format: tf.transformation_function.datatype,
                type: tf.transformation_function.datatype
            }))
            const originalFields = _.differenceBy(dataFields, transformationFields, "name")
            dataFields = _.concat(originalFields, transformationFields)
        }
        dataFields.push(rawIngestionSpecDefaults.synctsField)
        _.remove(dataFields, { is_deleted: true }) // Delete all the excluded fields
        return dataFields;
    }

    getAllFieldsHudi = async (dataset: Record<string, any>, type: string): Promise<Record<string, any>[]> => {

        const { data_schema, denorm_config, transformations_config } = dataset
        let dataFields = this.flattenSchema(data_schema, type);
        if (!_.isEmpty(denorm_config.denorm_fields)) {
            for (const denormField of denorm_config.denorm_fields) {
                const denormDataset: any = await datasetService.getDataset(denormField.dataset_id, ["data_schema"], true);
                const properties = this.flattenSchema(denormDataset.data_schema, type);
                const transformProps = _.map(properties, (prop) => {
                    _.set(prop, "name", _.join([_.replace(denormField.denorm_out_field, /\./g, "_"), prop.name], "_"));
                    _.set(prop, "expr", _.replace(prop.expr, "$", "$." + denormField.denorm_out_field));
                    return prop;
                });
                dataFields.push(...transformProps);
            }
        }
        if (!_.isEmpty(transformations_config)) {
            const transformationFields = _.map(transformations_config, (tf) => ({
                expr: "$." + tf.field_key,
                name: _.replace(tf.field_key, /\./g, "_"),
                data_type: tf.transformation_function.datatype,
                arrival_format: tf.transformation_function.datatype,
                type: tf.transformation_function.datatype
            }))
            const originalFields = _.differenceBy(dataFields, transformationFields, "name")
            dataFields = _.concat(originalFields, transformationFields)
        }
        dataFields.push(rawIngestionSpecDefaults.hudiSynctsField)
        _.remove(dataFields, { is_deleted: true }) // Delete all the excluded fields
        return dataFields;
    }
}

class TableGenerator extends BaseTableGenerator {

    getDruidIngestionSpec = (dataset: Record<string, any>, allFields: Record<string, any>[], datasourceRef: string) => {

        const { dataset_config, router_config } = dataset
        const ingestionSpecDefaults = _.cloneDeep(rawIngestionSpecDefaults)
        return {
            "type": "kafka",
            "spec": {
                "dataSchema": {
                    "dataSource": datasourceRef,
                    "dimensionsSpec": { "dimensions": this.getDruidDimensions(allFields, this.getTimestampKey(dataset, "druid"), dataset_config.keys_config.partition_key) },
                    "timestampSpec": { "column": this.getTimestampKey(dataset, "druid"), "format": "auto" },
                    "metricsSpec": [],
                    "granularitySpec": ingestionSpecDefaults.granularitySpec
                },
                "tuningConfig": ingestionSpecDefaults.tuningConfig,
                "ioConfig": _.merge(ingestionSpecDefaults.ioConfig, {
                    "topic": router_config.topic,
                    "inputFormat": {
                        "flattenSpec": {
                            "fields": this.getDruidFlattenSpec(allFields)
                        }
                    }
                })
            }
        }
    }

    private getDruidDimensions = (allFields: Record<string, any>[], timestampKey: string, partitionKey: string | undefined) => {

        const dataFields = _.cloneDeep(allFields);
        if (partitionKey) { // Move the partition column to the top of the dimensions
            const partitionCol = _.remove(dataFields, { name: partitionKey })
            if (partitionCol && _.size(partitionCol) > 0) {
                dataFields.unshift(partitionCol[0])
            }
        }
        _.remove(dataFields, { name: timestampKey })
        return _.union(
            _.map(dataFields, (field) => {
                return {
                    "type": this.getDruidDimensionType(field.data_type),
                    "name": field.name
                }
            }),
            rawIngestionSpecDefaults.dimensions
        )
    }

    private getDruidDimensionType = (data_type: string): string => {
        switch (data_type) {
            case "number": return "double";
            case "integer": return "long";
            case "object": return "json";
            case "boolean": return "string";
            case "array": return "json";
            case "string": return "string";
            default: return "auto";
        }
    }

    private getDruidFlattenSpec = (fields: Record<string, any>) => {
        const allfields = _.map(fields, (field) => {
            return {
                type: "path",
                expr: field.expr,
                name: field.name
            }
        });
        return _.uniqBy([...allfields, ...rawIngestionSpecDefaults.flattenSpec], "name")
    }

    getHudiIngestionSpecForCreate = (dataset: Record<string, any>, allFields: Record<string, any>[], datasourceRef: string) => {

        const primaryKey = this.getPrimaryKey(dataset);
        const partitionKey = this.getHudiPartitionKey(dataset);
        const timestampKey = this.getTimestampKey(dataset, "datalake");
        return {
            dataset: dataset.dataset_id,
            schema: {
                table: _.includes(datasourceRef, "-")
                    ? _.replace(datasourceRef, /-/g, "_")
                    : datasourceRef,
                partitionColumn: partitionKey,
                timestampColumn: timestampKey,
                primaryKey: primaryKey,
                columnSpec: this.getHudiColumnSpec(allFields, primaryKey, partitionKey, timestampKey)
            },
            inputFormat: {
                type: "json",
                flattenSpec: {
                    fields: this.getHudiFields(allFields)
                }
            }
        }
    }

    getHudiIngestionSpecForUpdate = (dataset: Record<string, any>, existingHudiSpec: Record<string, any>, allFields: Record<string, any>[], datasourceRef: string) => {

        const newHudiSpec = this.getHudiIngestionSpecForCreate(dataset, allFields, datasourceRef)

        const newColumnSpec = newHudiSpec.schema.columnSpec;
        const oldColumnSpec = existingHudiSpec.schema.columnSpec;
        let currIndex = _.get(_.maxBy(oldColumnSpec, "index"), "index") as unknown as number
        const newColumns = _.differenceBy(newColumnSpec, oldColumnSpec, "name");
        if (_.size(newColumns) > 0) {
            _.each(newColumns, (col) => {
                oldColumnSpec.push({
                    "type": col.type,
                    "name": col.name,
                    "index": currIndex++
                })
            })
        }
        _.set(newHudiSpec, "schema.columnSpec", oldColumnSpec)
        return newHudiSpec;
    }

    // eslint-disable-next-line
    private getHudiColumnSpec = (allFields: Record<string, any>[], primaryKey: string, partitionKey: string, timestampKey: string): Record<string, any>[] => {

        const dataFields = _.cloneDeep(allFields);
        let index = 1;
        const transformFields = _.map(dataFields, (field) => {
            return {
                "type": this.getHudiColumnType(field),
                "name": field.name,
                "index": index++
            }
        })
        _.each(rawIngestionSpecDefaults.hudi_dimensions, (field) => {
            transformFields.push({
                "type": field.type,
                "name": field.name,
                "index": index++
            })
        })
        return transformFields;
    }

    private getHudiColumnType = (field: Record<string, any>): string => {
        if (field.data_type === "array" && field.arrival_format !== "array") {
            return "array";
        }
        if (field.data_type === "array" && field.arrival_format === "array") {
            switch (field.type) {
                case "string":
                    return "array<string>"
                case "number":
                    return "array<double>"
                case "integer":
                    return "array<int>"
                case "boolean":
                    return "array<boolean>"
                default:
                    return "array<object>"
            }
        }
        switch (field.arrival_format) {
            case "text":
                return "string"
            case "number":
                switch (field.data_type) {
                    case "integer":
                        return "int"
                    case "epoch":
                        return "epoch"
                    case "bigdecimal":
                        return "bigdecimal"
                    case "float":
                        return "float"
                    case "long":
                        return "long"
                    default:
                        return "double"
                }
            case "integer":
                return "int"
            case "boolean":
                return "boolean"
            default:
                return "string"
        }
    }

    private getHudiFields = (allFields: Record<string, any>[]): Record<string, any>[] => {

        const regexString = "[\\[\\]'\\*]";
        const regex = new RegExp(regexString, "g");
        return _.union(
            _.map(allFields, (field) => {
                return {
                    type: "path",
                    expr: _.replace(field.expr, regex, ""),
                    name: field.name
                }
            }),
            rawIngestionSpecDefaults.hudi_flattenSpec
        )
    }

    private getPrimaryKey = (dataset: Record<string, any>): string => {
        return _.replace(dataset.dataset_config.keys_config.data_key, /\./g, "_");
    }

    private getHudiPartitionKey = (dataset: Record<string, any>): string => {
        const partitionKey = dataset.dataset_config.keys_config.partition_key || dataset.dataset_config.keys_config.timestamp_key;
        return _.replace(partitionKey, /\./g, "_")
    }

    private getTimestampKey = (dataset: Record<string, any>, type: string): string => {
        const timestamp = dataset.dataset_config.keys_config.timestamp_key;
        if (type === "druid") {
            return timestamp;
        }
        return _.replace(timestamp, /\./g, "_");
    }
}

export const tableGenerator = new TableGenerator();