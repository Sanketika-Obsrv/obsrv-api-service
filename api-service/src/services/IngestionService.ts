import _ from "lodash";
import { config } from "../configs/Config";
const defaultIndexCol = config.ingestion_config.indexCol["Event Arrival Time"]

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
            "message": "Provided timestamp key not found in the schema",
            "status": 400,
            "code": "BAD_REQUEST"
        }
    }
    const simplifiedSpec = generateExpression(_.get(data_schema, "properties"), indexCol);
    const generatedSpec = process(simplifiedSpec, indexCol)
    const ingestionTemplate = getIngestionTemplate({ generatedSpec, id, indexCol, dataset_id })
    return ingestionTemplate
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

const process = (spec: Map<string, any>, indexCol: string) => {
    const colValues = Array.from(spec.values())
    const dimensions = filterDimensionCols(colValues)
    return {
        "dimensions": getObjByKey(dimensions, "dimensions"),
        "metrics": filterMetricsCols(spec),
        "flattenSpec": filterFlattenSpec(colValues, indexCol)
    }
}

const filterFlattenSpec = (column: Record<string, any>, indexCol: string) => {
    let flattenSpec = getObjByKey(column, "flattenSpec")
    if (indexCol === defaultIndexCol) {
        const indexColDefaultSpec = {
            "expr": config.syncts_path,
            "name": config.ingestion_config.indexCol["Event Arrival Time"],
            "type": "path"
        }
        flattenSpec = _.concat(flattenSpec, indexColDefaultSpec)
    }
    return flattenSpec
}

const filterMetricsCols = (spec: Record<string, any>) => {
    const metrics = _.filter(spec, cols => cols.fieldType === "metrics")
    const metricCols = _.map(metrics, (value) => value["dimensions"])
    let updatedMetrics: any[] = []
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
    return _.filter(result, (value) => value && value !== undefined);
}

export const generateFlattenSchema = (sample: Map<string, any>) => {
    let array = new Array();
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
    let flattendedSchema = new Map();
    const recursive = (data: any, path: string) => {
        _.map(data, (value, key) => {
            if (_.isPlainObject(value) && (_.has(value, 'properties'))) {
                recursive(value['properties'], `${path}.${key}`);
            } else if (_.isPlainObject(value)) {
                if (value.type === 'array') {
                    if (_.has(value, 'items') && _.has(value["items"], 'properties')) {
                        recursive(value["items"]['properties'], `${path}.${key}[*]`);
                    } else {
                        const objectType = getObjectType(value.type)
                        const specObject = createSpecObj({ expression: `${path}.['${key}'][*]`, objectType, name: `${path}.${key}`, indexCol })
                        flattendedSchema.set(`${path}.${key}`, specObject)
                    }
                } else if (value.type == 'object' && (!_.has(value, 'properties'))) {
                    const objectType = getObjectType(value.type)
                    const specObject = createSpecObj({ expression: `${path}.['${key}']`, objectType, name: `${path}.${key}`, indexCol })
                    flattendedSchema.set(`${path}.${key}`, specObject)
                    console.warn(`Found empty object without properties in the schema..Key: ${key}, Object: ${JSON.stringify(value)}`)
                }
                else {
                    const objectType = getObjectType(value.type)
                    const specObject = createSpecObj({ expression: `${path}.['${key}']`, objectType, name: `${path}.${key}`, indexCol })
                    flattendedSchema.set(`${path}.${key}`, specObject)
                }
            }
        })
    }
    recursive(sample, "$")
    flattendedSchema.set("obsrv.meta.source.connector", connectorSpecObj).set("obsrv.meta.source.connector.instance", connectorInstanceSpecObj)
    return flattendedSchema
}

const createSpecObj = (payload: Record<string, any>): any => {
    const { expression, objectType, name, indexCol } = payload
    let dataType = objectType;
    if (expression.indexOf("[*]") > -1) {
        dataType = "array"
    }
    const specObj = {
        "flattenSpec": {
            "type": "path",
            "expr": expression,
            "name": _.replace(name.replace("[*]", ""), "$.", "")
        },
        "dimensions": {
            "type": dataType,
            "name": _.replace(name.replace("[*]", ""), "$.", "")
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
    };
}

export const getIngestionTemplate = (payload: Record<string, any>) => {
    const { id, generatedSpec, indexCol, dataset_id } = payload
    const { dimensions, metrics, flattenSpec } = generatedSpec
    const dataSource = `${id}_${config.ingestion_config.granularitySpec.segmentGranularity}`
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
                "maxBytesInMemory": config.ingestion_config.maxBytesInMemory,
                "maxRowsPerSegment": config.ingestion_config.tuningConfig.maxRowPerSegment,
                "logParseExceptions": true
            },
            "ioConfig": getIOConfigObj(flattenSpec, dataset_id)
        }
    }
}

const getGranularityObj = () => {
    return {
        "type": "uniform",
        "segmentGranularity": config.ingestion_config.granularitySpec.segmentGranularity,
        "queryGranularity": config.ingestion_config.query_granularity,
        "rollup": config.ingestion_config.granularitySpec.rollup
    }
}

const getIOConfigObj = (flattenSpec: Record<string, any>, topic: string): Record<string, any> => {
    return {
        "type": "kafka",
        "topic": topic,
        "consumerProperties": { "bootstrap.servers": config.telemetry_service_config.kafka.config.brokers[0] },
        "taskCount": config.ingestion_config.tuningConfig.taskCount,
        "replicas": 1,
        "taskDuration": config.ingestion_config.ioconfig.taskDuration,
        "useEarliestOffset": config.ingestion_config.use_earliest_offset,
        "completionTimeout": config.ingestion_config.completion_timeout,
        "inputFormat": {
            "type": "json", "flattenSpec": {
                "useFieldDiscovery": true, "fields": flattenSpec
            }
        },
        "appendToExisting": false
    }
}