import _ from "lodash";
import { ingestionConfig } from "../configs/IngestionConfig";
import { config } from "../configs/Config";
import { ErrorObject } from "../types/ResponseModel";
import logger from "../logger";
import { IngestionSpecModel, IngestionSpecObject } from "../types/IngestionModels";
const defaultIndexCol = ingestionConfig.indexCol["Event Arrival Time"]

const connectorSpecObj = {
    "flattenSpec": {
        "type": "path",
        "expr": "$.obsrv_meta.source.['connector']",
        "name": "obsrv.meta.source.connector"
    },
    "dimensions": {
        "type": "string",
        "name": "obsrv.meta.source.connector"
    },
    "fieldType": "dimensions"
}

const connectorInstanceSpecObj = {
    "flattenSpec": {
        "type": "path",
        "expr": "$.obsrv_meta.source.['connectorInstance']",
        "name": "obsrv.meta.source.id"
    },
    "dimensions": {
        "type": "string",
        "name": "obsrv.meta.source.id"
    },
    "fieldType": "dimensions"
}

export const generateIngestionSpec = (payload: Record<string, any>) => {
    const { indexCol = defaultIndexCol, data_schema, id, dataset_id } = payload
    const isValidTimestamp = checkTimestampCol({ indexCol, data_schema })
    if (!isValidTimestamp) {
        throw {
            "code": "DATASET_TIMESTAMP_NOT_FOUND",
            "message": "Provided timestamp key not found in the data schema",
            "statusCode": 400,
            "errCode": "BAD_REQUEST"
        } as ErrorObject
    }
    const simplifiedSpec = generateExpression(_.get(data_schema, "properties"), indexCol);
    const generatedSpec = process(simplifiedSpec, indexCol)
    const ingestionTemplate = generateIngestionTemplate({ generatedSpec, id, indexCol, dataset_id, type: "druid" })
    return ingestionTemplate
}

const generateIngestionTemplate = (payload: Record<string, any>) => {
    const { type, ...rest } = payload
    switch (type) {
        case 'druid':
            return getDruidIngestionTemplate(rest);
        default:
            return null;
    }
}

const checkTimestampCol = (schema: Record<string, any>) => {
    const { indexCol, data_schema } = schema
    if (indexCol !== defaultIndexCol) {
        const properties = generateFlattenSchema(data_schema);
        const exists = _.find(properties, (value) => `$.${indexCol}` === value.path);
        return exists
    }
    return true
}

const process = (spec: Map<string, any>, indexCol: string): IngestionSpecModel => {
    const colValues = Array.from(spec.values())
    const dimensions = filterDimensionCols(colValues)
    return <IngestionSpecModel>{
        "dimensions": getObjByKey(dimensions, "dimensions"),
        "metrics": filterMetricsCols(spec),
        "flattenSpec": filterFlattenSpec(colValues, indexCol)
    }
}

const filterFlattenSpec = (column: Record<string, any>, indexCol: string) => {
    let flattenSpec = getObjByKey(column, "flattenSpec")
    if (indexCol === defaultIndexCol) {
        const indexColDefaultSpec = {
            "expr": ingestionConfig.syncts_path,
            "name": ingestionConfig.indexCol["Event Arrival Time"],
            "type": "path"
        }
        flattenSpec = _.concat(flattenSpec, indexColDefaultSpec)
    }
    return flattenSpec
}

const filterMetricsCols = (spec: Record<string, any>) => {
    const metrics = _.filter(spec, cols => cols.fieldType === "metrics")
    const metricCols = _.map(metrics, (value) => value["dimensions"])
    const updatedMetrics: any[] = []
    _.map(metricCols, (value) => {
        value["fieldName"] = value["fieldName"] || value["name"];
        updatedMetrics.push(value);
    });
    return updatedMetrics;
}

const filterDimensionCols = (spec: Record<string, any>) => {
    const dimensionCols = _.filter(spec, cols => cols.fieldType === "dimensions")
    return dimensionCols
}

const getObjByKey = (sample: any, key: string) => {
    const result = _.map(sample, (value) => _.get(value, key));
    return _.compact(result)
}

export const generateFlattenSchema = (sample: Map<string, any>) => {
    const array: any[] = [];
    const flattenValues = (data: any, path: string) => {
        _.map(data, (value, key) => {
            if (_.isPlainObject(value) && _.has(value, 'properties')) {
                array.push(flattenSchema(key, `${path}.${key}`))
                flattenValues(value['properties'], `${path}.${key}`);
            } else if (_.isPlainObject(value)) {
                if (value.type === 'array') {
                    array.push(flattenSchema(key, `${path}.${key}`))
                    if (_.has(value, 'items') && _.has(value["items"], 'properties')) {
                        flattenValues(value["items"]['properties'], `${path}.${key}`);
                    }
                } else {
                    array.push(flattenSchema(key, `${path}.${key}`))
                }
            }
        })
    }
    const properties = _.get(sample, "properties")
    flattenValues(properties, "$")
    return array
}

const flattenSchema = (expr: string, path: string) => {
    return { "property": expr, "path": path }
}

export const generateExpression = (sample: Map<string, any>, indexCol: string): Map<string, any> => {
    const flattendedSchema = new Map();
    const flattenExpression = (data: any, path: string) => {
        _.map(data, (value, key) => {
            if (_.isPlainObject(value) && (_.has(value, 'properties'))) {
                flattenExpression(value['properties'], `${path}.${key}`);
            } else if (_.isPlainObject(value)) {
                if (value.type === 'array') {
                    if (_.has(value, 'items') && _.has(value["items"], 'properties')) {
                        flattenExpression(value["items"]['properties'], `${path}.${key}[*]`);
                    } else {
                        const objectType = getObjectType(value.type)
                        const specObject = createSpecObj({ expression: `${path}.['${key}'][*]`, objectType, name: `${path}.${key}`, indexCol })
                        flattendedSchema.set(`${path}.${key}`, specObject)
                    }
                } else if (value.type == 'object' && (!_.has(value, 'properties'))) {
                    const objectType = getObjectType(value.type)
                    const specObject = createSpecObj({ expression: `${path}.['${key}']`, objectType, name: `${path}.${key}`, indexCol })
                    flattendedSchema.set(`${path}.${key}`, specObject)
                    logger.warn(`Found empty object without properties in the schema with Key: ${key}, Object: ${JSON.stringify(value)}`)
                }
                else {
                    const objectType = getObjectType(value.type)
                    const specObject = createSpecObj({ expression: `${path}.['${key}']`, objectType, name: `${path}.${key}`, indexCol })
                    flattendedSchema.set(`${path}.${key}`, specObject)
                }
            }
        })
    }
    flattenExpression(sample, "$")
    flattendedSchema.set("obsrv.meta.source.connector", connectorSpecObj).set("obsrv.meta.source.connector.instance", connectorInstanceSpecObj)
    return flattendedSchema
}

const createSpecObj = (payload: Record<string, any>): IngestionSpecObject => {
    const { expression, objectType, name, indexCol } = payload
    const propertyName = _.replace(name.replace("[*]", ""), "$.", "")
    const specObj = {
        "flattenSpec": {
            "type": "path",
            "expr": expression,
            "name": propertyName
        },
        "dimensions": {
            "type": objectType,
            "name": propertyName
        },
        "fieldType": "dimensions"
    }
    if ([indexCol].includes(specObj.flattenSpec.name)) {
        specObj.fieldType = "timestamp"
    }
    return specObj
}

const getObjectType = (type: string): string => {
    switch (type) {
        case "number": return "double";
        case "integer": return "long";
        case "object": return "json";
        case "boolean": return "string";
        default: return type;
    }
}

export const getDruidIngestionTemplate = (payload: Record<string, any>) => {
    const { id, generatedSpec, indexCol, dataset_id } = payload
    const { dimensions, metrics, flattenSpec } = generatedSpec
    const dataSource = `${id}_${_.toLower(ingestionConfig.granularitySpec.segmentGranularity)}`
    return {
        "type": "kafka",
        "spec": {
            "dataSchema": {
                "dataSource": dataSource,
                "dimensionsSpec": { "dimensions": dimensions },
                "timestampSpec": { "column": indexCol, "format": "auto" },
                "metricsSpec": metrics,
                "granularitySpec": getGranularityObj(),
            },
            "tuningConfig": {
                "type": "kafka",
                "maxBytesInMemory": ingestionConfig.maxBytesInMemory,
                "maxRowsPerSegment": ingestionConfig.tuningConfig.maxRowPerSegment,
                "logParseExceptions": true
            },
            "ioConfig": getIOConfigObj(flattenSpec, dataset_id)
        }
    }
}

const getGranularityObj = () => {
    return {
        "type": "uniform",
        "segmentGranularity": ingestionConfig.granularitySpec.segmentGranularity,
        "queryGranularity": ingestionConfig.query_granularity,
        "rollup": ingestionConfig.granularitySpec.rollup
    }
}

const getIOConfigObj = (flattenSpec: Record<string, any>, topic: string): Record<string, any> => {
    return {
        "type": "kafka",
        "topic": topic,
        "consumerProperties": { "bootstrap.servers": config.telemetry_service_config.kafka.config.brokers[0] },
        "taskCount": ingestionConfig.tuningConfig.taskCount,
        "replicas": 1,
        "taskDuration": ingestionConfig.ioconfig.taskDuration,
        "useEarliestOffset": ingestionConfig.use_earliest_offset,
        "completionTimeout": ingestionConfig.completion_timeout,
        "inputFormat": {
            "type": "json", "flattenSpec": {
                "useFieldDiscovery": true, "fields": flattenSpec
            }
        },
        "appendToExisting": false
    }
}