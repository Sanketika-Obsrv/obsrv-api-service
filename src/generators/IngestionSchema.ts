import _ from "lodash";
import { IngestionConfig, IngestionSpecModel, ISchemaGenerator } from "../models/ingestionModels";
let count=0

export class IngestionSchema implements ISchemaGenerator {
    private ingestionConfig: IngestionConfig;
    private dataSet: string;
    private indexCol: string;
    private regex: RegExp = /\./g;

    constructor(dataSet: string,  config: IngestionConfig) {
        this.dataSet = dataSet
        this.ingestionConfig = config;
        this.indexCol = config.indexCol
    }
    /**
     *  Generates the Ingestion Schema
     * @param sample -  Map<string, any>[]), Generate Ingestion Schema against Sample Data 
     * @returns - any, Ingestion Template
     */
    generate(sample: Map<string, any>[]): any {
        const generatedSpec: IngestionSpecModel[] = _.map(sample, (value, key): any => {
            return this.process(value)
        })

        const dims = _.uniqBy(_.flatMap(generatedSpec, (value, key) => {
            return value.dimensions
        }), "name")


        const metrics = _.uniqBy(_.flatMap(generatedSpec, (value, key) => {
            return value.metrics
        }), "name")


        const flattenSpec = _.uniqBy(_.flatMap(generatedSpec, (value, key) => {
            return value.flattenSpec
        }), "name")


        return this.getIngestionTemplate(flattenSpec, dims, metrics)
    }

    /**
     * Method to process the sample rquest
     * 
     * @param sample - Map<string, any>
     * @returns - IngestionSpecModel
     */
    process(sample: Map<string, any>): IngestionSpecModel {
        const simplifiedSpec = this.generateExpression(sample)
 
        const metrics = this.filterMetricsCols(simplifiedSpec)

        const dims = this.filterDimsCols(simplifiedSpec)

        var flattenSpec = _.merge(this.getObjByKey(dims, "flattenSpec"), this.getObjByKey(metrics, "flattenSpec"));

        return <IngestionSpecModel>{
            "dimensions": this.getObjByKey(dims, "dimensions"),
            "metrics": this.updateMetricsCols(metrics),
            "flattenSpec": flattenSpec
        }

    }

    getObjByKey(sample: any, key: string) {
        return _.map(sample, (value, keys) => { return value[key] })
    }

    updateMetricsCols(sample: any) {
        const metricCols = _.map(sample, (value, keys) => {
            return value["dimensions"]
        })
        return metricCols.map((value, key) => {
            value["fieldName"] = value["name"]
            return value
        })
    }

    filterMetricsCols(sample: Map<string, any>): any[] {
        const metricsType = ["doubleSum"]
        return Array.from(sample.values()).filter((item: any) => _.includes(metricsType, item["propert_type"]));
    }

    filterDimsCols(sample: Map<string, any>): any[] {
        const metricsType = ["doubleSum"]
        return Array.from(sample.values()).filter((item: any) => !_.includes(metricsType, item["propert_type"]));
    }

    generateExpression(sample: Map<string, any>): Map<string, any> {
        let map = new Map();
        const recursive = (data: any, path: string) => {
             _.forEach(data, (value, key) => {
                 if (_.isPlainObject(value)) {
                    recursive(value, `${path}.${key}`);
                 } else if (this.getObjectType(value) === "array") {
                    if (this.isComplexArray(value)) { // defines simple array or complex array
                        let mergedResult = _.assign.apply(_, value)
                        recursive(mergedResult, `${path}.${key}[*]`);
                    } else {
                        map.set(key, this.createSpecObj(`${path}.${key}[*]`, this.getObjectType(value), `${path}_${key}`))
                    }
                }
                else {
                    map.set(key, this.createSpecObj(`${path}.${key}`, this.getObjectType(value), `${path}_${key}`))
                }
            })
        }
        recursive(sample, "$")
        count=count+1
        return map
    }

    createSpecObj(expr: string, objType: string, name: string): any {
        return {
            "flattenSpec": {
                "type": "path",
                "expr": expr,
                "name": _.replace(name.replace(this.regex, "_"), "$_", "")
            },
            "dimensions": {
                "type": objType,
                "name": _.replace(name.replace(this.regex, "_"), "$_", "")
            },
            "propert_type": objType
        }
    }

    isComplexArray(sample: any[]): boolean {
        let obj = _.head(_.uniq(_.map(sample, (value, key) => {
            return typeof value
        })))
        return _.isEqual(obj, typeof {}) ? true : false
    }

    getObjectType(obj: any): string {
        switch (typeof obj) {
            case "object": {
                return _.isArray(obj) ? "array" : "object"
            }
            case "number": {
                return _.isNumber(obj) ? "doubleSum" : "number"
            }
            default: {
                return typeof obj
            }
        }
    }

    getIngestionTemplate(flattenSpec: any, dims: any, metrics: any): any {
        return {
            "type": "kafka",
            "spec": {
                "dataSchema": {
                    "dataSource": this.dataSet,
                    "dimensionsSpec": { "dimensions": dims },
                    "timestampSpec": { "column": this.indexCol, "format": "auto" },
                    "metricsSpec": metrics,
                    "granularitySpec": this.getGranularityObj()
                },
                "tuningConfig": {
                    "type": "kafka",
                    "maxRowsPerSegment": this.ingestionConfig.tuningConfig.maxRowPerSegment,
                    "logParseExceptions": true
                },
                "ioConfig": this.getIOConfigObj(flattenSpec)
            }
        }
    }

    getGranularityObj(): any {
        return {
            "type": "uniform",
            "segmentGranularity": this.ingestionConfig.granularitySpec.segmentGranularity,
            "queryGranularity": this.ingestionConfig.granularitySpec.queryGranularity,
            "rollup": this.ingestionConfig.granularitySpec.rollup
        }
    }

    getIOConfigObj(flattenSpec: any): any {
        return {
            "type": "kafka",
            "topic": this.ingestionConfig.ioConfig.topic,
            "consumerProperties": { "bootstrap.servers": this.ingestionConfig.ioConfig.bootstrapIp },
            "taskCount": this.ingestionConfig.tuningConfig.taskCount,
            "replicas": 1,
            "taskDuration": this.ingestionConfig.ioConfig.taskDuration,
            "useEarliestOffset": false,
            "completionTimeout": "PT8H",
            "inputFormat": { "type": "json", "flattenSpec": { "useFieldDiscovery": true, "fields": flattenSpec } },
            "appendToExisting": false
        }
    }
}

export { IngestionConfig };

