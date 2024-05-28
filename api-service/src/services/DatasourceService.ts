import { Datasource } from "../models/Datasource";
import { DatasourceDraft } from "../models/DatasourceDraft";
import _ from "lodash";

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

export const generateFlattenSchema = (sample: Map<string, any>): any[] => {
    const array: any[] = [];
    const recursive = (data: any, path: string, requiredProps: string[], schemaPath: string) => {
        _.map(data, (value, key) => {
            let isMultipleTypes = '';
            if (_.has(value, 'anyOf')) isMultipleTypes = 'anyOf';
            if (_.has(value, 'oneOf')) isMultipleTypes = 'oneOf';
            if (_.isPlainObject(value) && (_.has(value, 'properties'))) {
                array.push(_flattenSchema(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value['format'], value?.arrival_format, value?.data_type))
                recursive(value['properties'], `${path}.${key}`, value['required'], `${schemaPath}.properties.${key}`);
            } else if (_.isPlainObject(value)) {
                if (value.type === 'array') {
                    array.push(_flattenSchema(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value['format'], value?.arrival_format, value?.data_type))
                    if (_.has(value, 'items') && _.has(value["items"], 'properties')) {
                        recursive(value["items"]['properties'], `${path}.${key}[*]`, value["items"]['required'], `${schemaPath}.properties.${key}.items`);
                    }
                } else if (isMultipleTypes != '') {
                    array.push(_flattenSchema(key, value[isMultipleTypes][0].type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value['format'], value?.arrival_format, value?.data_type))
                    array.push(_flattenSchema(key, value[isMultipleTypes][1].type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value['format'], value?.arrival_format, value?.data_type))
                } else {
                    array.push(_flattenSchema(key, value.type, _.includes(requiredProps, key), `${path}.${key}`, `${schemaPath}.properties.${key}`, value['format'], value?.arrival_format, value?.data_type))
                }
            }
        })
    }
    recursive(sample.get("properties"), "$", sample.get("required"), "$")
    return array
}

const _flattenSchema = (expr: string, objType: string, isRequired: boolean, path: string, schemaPath: string, format: string, arrivalFormat: string, dataType: string) => {
    return <any>{ "property": expr, "type": objType, "isRequired": isRequired, "path": path, "absolutePath": schemaPath, "format": format, arrivalFormat, dataType }
}