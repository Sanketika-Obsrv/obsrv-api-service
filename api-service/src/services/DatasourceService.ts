import _ from "lodash";
import { ingestionConfig } from "../configs/IngestionConfig";
import { Datasource } from "../models/Datasource";
import { DatasourceDraft } from "../models/DatasourceDraft";
import { DatasetTransformationsDraft } from "../models/TransformationDraft";
import { DatasetTransformations } from "../models/Transformation";
import { DatasetStatus } from "../types/DatasetModels";
import { Dataset } from "../models/Dataset";

export const DEFAULT_TIMESTAMP = {
    indexValue: "obsrv_meta.syncts",
    rootPath: "obsrv_meta",
    label: "syncts",
    path: "obsrv_meta.properties.syncts",
}

const defaultTsObject = [
    {
        "column": DEFAULT_TIMESTAMP.rootPath,
        "type": "object",
        "key": `properties.${DEFAULT_TIMESTAMP.rootPath}`,
        "ref": `properties.${DEFAULT_TIMESTAMP.rootPath}`,
        "isModified": true,
        "required": false,
    },
    {
        "column": DEFAULT_TIMESTAMP.label,
        "type": "integer",
        "key": `properties.${DEFAULT_TIMESTAMP.path}`,
        "ref": `properties.${DEFAULT_TIMESTAMP.path}`,
        "isModified": true,
        "required": false,
    }
]

export const getDatasourceList = async (datasetId: string, raw = false) => {
    const dataSource = await Datasource.findAll({
        where: {
            dataset_id: datasetId,
        },
        raw: raw
    });
    return dataSource
}

export const getDraftDatasourceList = async (datasetId: string, raw = false) => {
    const dataSource = await DatasourceDraft.findAll({
        where: {
            dataset_id: datasetId,
        },
        raw: raw
    });
    return dataSource
}

export const getDatasource = async (datasetId: string) => {
    const dataSource = await Datasource.findOne({
        where: {
            dataset_id: datasetId,
        },
    });
    return dataSource
}

export const getUpdatedSchema = async (configs: Record<string, any>) => {
    const { id, transformation_config, denorm_config, data_schema, action, indexCol = ingestionConfig.indexCol["Event Arrival Time"] } = configs
    const existingTransformations = await DatasetTransformationsDraft.findAll({ where: { dataset_id: id }, raw: true })
    let resultantTransformations: any[] = []
    if (action === "edit") {
        const toDeleteTransformations = _.compact(_.map(transformation_config, config => {
            if (_.includes(["update", "remove"], _.get(config, "action"))) {
                return _.get(config, ["value", "field_key"])
            }
        }))
        const updatedExistingTransformations = _.compact(_.map(existingTransformations, configs => {
            if (!_.includes(toDeleteTransformations, _.get(configs, "field_key"))) {
                return configs
            }
        })) || []
        const newTransformations = _.compact(_.map(transformation_config, config => {
            if (_.includes(["update", "add"], _.get(config, "action"))) {
                return config
            }
        })) || []
        resultantTransformations = [...updatedExistingTransformations, ...newTransformations]
    }
    if (action === "create") {
        resultantTransformations = transformation_config || []
    }
    let denormFields = _.get(denorm_config, "denorm_fields")
    let updatedColumns = flattenSchema(data_schema)
    const transformedFields = _.filter(resultantTransformations, field => _.get(field, ["metadata", "section"]) === "transformation")
    let additionalFields = _.filter(resultantTransformations, field => _.get(field, ["metadata", "section"]) === "additionalFields")
    updatedColumns = _.map(updatedColumns, (item) => {
        const transformedData = _.find(transformedFields, { field_key: item.column });
        if (transformedData) {
            const data = _.get(transformedData, "metadata")
            return {
                ...item,
                type: _.get(data, "_transformedFieldSchemaType") || "string",
                isModified: true,
                ...data
            };
        }
        return item;
    });
    denormFields = _.size(denormFields) ? await formatDenormFields(denormFields) : []
    additionalFields = formatNewFields(additionalFields, null);
    let ingestionPayload = { schema: [...updatedColumns, ...denormFields, ...additionalFields] };
    if (indexCol === ingestionConfig.indexCol["Event Arrival Time"])
        ingestionPayload = { schema: [...updatedColumns, ...defaultTsObject, ...denormFields, ...additionalFields] };
    const updatedIngestionPayload = updateJSONSchema(data_schema, ingestionPayload)
    return updatedIngestionPayload
}

export const updateJSONSchema = (schema: Record<string, any>, updatePayload: Record<string, any>) => {
    const clonedOriginal = _.cloneDeep(schema);
    const modifiedRows = _.filter(_.get(updatePayload, "schema"), ["isModified", true]);
    _.forEach(modifiedRows, modifiedRow => {
        const { isDeleted = false, required = false, key, type, description = null, arrival_format, data_type, isModified = false } = modifiedRow;
        if (isDeleted) {
            deleteItemFromSchema(clonedOriginal, `${key}`, false);
        } else {
            updateTypeInSchema(clonedOriginal, `${key}`, type, true);
            updateFormatInSchema(clonedOriginal, `${key}`, arrival_format);
            updateDataTypeInSchema(clonedOriginal, `${key}`, data_type, isModified);
            descriptionInSchema(clonedOriginal, `${key}`, description);
            changeRequiredPropertyInSchema(clonedOriginal, `${key}`, required);
        }
    });
    return clonedOriginal;
}


const updateDataTypeInSchema = (schema: Record<string, any>, schemaPath: string, data_type: string, isModified: boolean) => {
    const existing = _.get(schema, schemaPath);
    if (isModified) {
        const validDateFormats = ["date-time", "date", "epoch"]
        if (!_.includes(validDateFormats, data_type)) {
            _.unset(existing, "format");
        } else {
            data_type === "epoch" ? _.set(existing, "format", "date-time") : _.set(existing, "format", data_type)
        }
    }
    _.set(schema, schemaPath, { ...existing, data_type });
}


const descriptionInSchema = (schema: Record<string, any>, schemaPath: string, description: string) => {
    const existing = _.get(schema, schemaPath);
    if (description) _.set(schema, schemaPath, { ...existing, description });
}

const updateFormatInSchema = (schema: Record<string, any>, schemaPath: string, arrival_format: string) => {
    const existing = _.get(schema, schemaPath);
    _.set(schema, schemaPath, { ...existing, arrival_format });
}

const updateTypeInSchema = (schema: Record<string, any>, schemaPath: string, type: string, removeSuggestions: boolean = false) => {
    const existing = _.get(schema, schemaPath);
    if (removeSuggestions) {
        _.unset(existing, "suggestions");
        _.unset(existing, "oneof");
        _.unset(existing, "arrivalOneOf")
    }
    _.set(schema, schemaPath, { ...existing, type });
}


const deleteItemFromSchema = (schema: Record<string, any>, schemaKeyPath: string, required: boolean) => {
    if (_.has(schema, schemaKeyPath)) {
        _.unset(schema, schemaKeyPath);
        changeRequiredPropertyInSchema(schema, schemaKeyPath, required);
    }
}

const getPathToRequiredKey = (schema: Record<string, any>, schemaKeyPath: string, schemaKey: string) => {
    const regExStr = `properties.${schemaKey}`;
    const regex = `(.${regExStr})`;
    const [pathToRequiredKey] = _.split(schemaKeyPath, new RegExp(regex, "g"));
    if (pathToRequiredKey === schemaKeyPath) return "required"
    return `${pathToRequiredKey}.required`
}

const changeRequiredPropertyInSchema = (schema: Record<string, any>, schemaKeyPath: string, required: boolean) => {
    const schemaKey = _.last(_.split(schemaKeyPath, "."));
    if (schemaKey) {
        const pathToRequiredProperty = getPathToRequiredKey(schema, schemaKeyPath, schemaKey);
        const existingRequiredKeys = _.get(schema, pathToRequiredProperty) || [];
        if (required) {
            // add to required property.
            const updatedRequiredKeys = _.includes(existingRequiredKeys, schemaKey) ? existingRequiredKeys : [...existingRequiredKeys, schemaKey];
            _.set(schema, pathToRequiredProperty, updatedRequiredKeys);
        } else {
            // remove from required property.
            const updatedRequiredKeys = _.difference(existingRequiredKeys, [schemaKey]);
            if (_.size(updatedRequiredKeys) > 0)
                _.set(schema, pathToRequiredProperty, updatedRequiredKeys);
        }
    }
}

export const formatNewFields = (newFields: Record<string, any>, dataMappings: any) => {
    if (newFields.length > 0) {
        const final = _.map(newFields, (item: any) => {
            const columnKey = _.join(_.map(_.split(_.get(item, "field_key"), "."), payload => `properties.${payload}`), ".")
            return {
                "column": item.field_key,
                "type": _.get(item, ["metadata", "_transformedFieldSchemaType"]) || "string",
                "key": columnKey,
                "ref": columnKey,
                "isModified": true,
                "required": false,
                "data_type": _.get(item, ["metadata", "_transformedFieldDataType"]),
                ...(dataMappings && { "arrival_format": getArrivalFormat(_.get(item, "_transformedFieldSchemaType"), dataMappings) || _.get(item, "arrival_format") })
            }
        });
        return final;
    }
    else return [];
}

const getArrivalFormat = (data_type: string | undefined, dataMappings: Record<string, any>) => {
    let result = null;
    if (data_type) {
        _.forEach(dataMappings, (value, key) => {
            if (_.includes(_.get(value, "arrival_format"), data_type)) {
                result = key;
            }
        });
    }
    return result;
}

export const updateDenormDerived = (schemaColumns: any, columns: any, fixedPrefix: string): any[] => {
    const result = _.map(columns, (column: any) => {
        const isExistingColumn = _.find(schemaColumns, ["column", column.field_key]);
        if (isExistingColumn) {
            return {
                ...isExistingColumn,
                "type": _.get(column, "metadata._transformedFieldSchemaType"),
                "data_type": _.get(column, "metadata._transformedFieldDataType"),
                "required": false,
                "isModified": true,
                ..._.get(column, "metadata"),
            };
        } else {
            const columnKey = _.join(_.map(_.split(_.get(column, "field_key"), "."), payload => `properties.${payload}`), ".")
            return {
                "column": `${fixedPrefix}.${column.field_key}`,
                "type": _.get(column, "metadata._transformedFieldSchemaType"),
                "key": `properties.${fixedPrefix}.${columnKey}`,
                "ref": `properties.${fixedPrefix}.${columnKey}`,
                "required": false,
                "isModified": true,
                "data_type": _.get(column, "metadata._transformedFieldDataType"),
                ..._.get(column, "metadata"),
            };
        }
    });
    return _.concat(schemaColumns, result);
}

const processDenormConfigurations = async (item: any) => {
    const denormFieldsData: any = [];
    const dataset_id = _.get(item, 'dataset_id');
    const denorm_out_field = _.get(item, "denorm_out_field");
    const dataset: any = await Dataset.findOne({ where: { "dataset_id": dataset_id }, raw: true }) || []
    const transformations = _.size(dataset) ? await DatasetTransformations.findAll({ where: { status: DatasetStatus.Live, dataset_id: _.get(dataset, "dataset_id") }, raw: true }) : []
    let schema = flattenSchema(_.get(dataset, "data_schema"), denorm_out_field, true);
    schema = updateDenormDerived(schema, _.get(transformations, "data.result"), denorm_out_field,);
    denormFieldsData.push({
        "column": denorm_out_field,
        "type": "object",
        "key": `properties.${denorm_out_field}`,
        "ref": `properties.${denorm_out_field}`,
        "isModified": true,
        "required": false,
        "arrival_format": "object",
        "data_type": "object",
    });
    denormFieldsData.push(...schema);
    return denormFieldsData;
}


export const formatDenormFields = async (denormFields: any) => {
    if (denormFields.length > 0) {
        const final = _.map(denormFields, (item: any) => {
            return processDenormConfigurations(item);
        });
        return Promise.all(final).then((data) => _.flatten(data));
    }
    else return [];
}

const addRequiredFields = (
    type: string,
    result: Record<string, any>,
    schemaObject: Record<string, any>,
    required: string[],
) => {
    const requiredFields = _.get(schemaObject, "required") || [];
    _.map(result, (item) => {
        if (type === "array" || type === "object") {
            if (required && required.includes(item.key.replace("properties.", ""))) item.required = true;
            else if (requiredFields.includes(item.key.replace("properties.", ""))) item.required = true;
            else item.required = false;
        }
        else if (requiredFields.includes(item.key.replace("properties.", ""))) item.required = true;
        else item.required = false;
    })
}

const flatten = (schemaObject: Record<string, any>, rollup: boolean = false) => {
    const schemaObjectData = schemaObject;
    const result: Record<string, any> = {};
    const getKeyName = (prefix: string, key: string) => prefix ? `${prefix}.${key}` : key;
    const flattenHelperFn = (propertySchema: Record<string, any>, prefix: string, ref: string, arrayChild = false) => {
        const { type, properties, items, required = false, ...rest } = propertySchema || {};
        if (type === "object" && properties) {
            if (prefix !== "" && !arrayChild) result[prefix] = { type, key: ref, ref, properties, items, parent: true, ...rest };
            for (const [key, value] of Object.entries(properties)) {
                flattenHelperFn(value as Record<string, any>, getKeyName(prefix, key), getKeyName(ref, `properties.${key}`));
            }
        } else if (type === "array" && items && !rollup) {
            if (prefix !== "") result[prefix] = { type, key: ref, ref, properties, items, parent: true, ...rest };
            if (["array", "object"].includes(items?.type)) {
                flattenHelperFn(items, prefix, getKeyName(ref, `items`), true)
            } else {
                result[prefix] = { type, key: ref, ref, properties, items, ...rest };
            }
        } else {
            result[prefix] = { type, key: ref, ref, properties, items, ...rest };
        }
        addRequiredFields(type, result, schemaObjectData, required);
    }

    flattenHelperFn(schemaObjectData, "", "");
    return result;
}

export const flattenSchema = (schema: Record<string, any>, fixedPrefix?: string | undefined, modified?: boolean, rollup: boolean = false) => {
    const flattend = flatten(schema, rollup);
    if (fixedPrefix)
        return _.map(flattend, (value, key) => {
            const { key: propertyKey, ref } = value;
            const keySplit = _.split(propertyKey, ".");
            const refSplit = _.split(ref, ".");
            keySplit.splice(1, 0, fixedPrefix, "properties");
            refSplit.splice(1, 0, fixedPrefix, "properties");
            const data = {
                column: `${fixedPrefix}.${key}`,
                ...value,
                key: keySplit.join("."),
                ref: refSplit.join("."),
            };
            if (modified) { data.isModified = true; data.required = false; }
            return data;
        });
    return _.map(flattend, (value, key) => ({ column: key, ...value }));
}