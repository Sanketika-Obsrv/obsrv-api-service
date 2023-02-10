import _ from "lodash";
import { ISchemaGenerator } from "../models/DatasetModels";
import { IngestionConfig, IngestionSpecModel } from "../models/ingestionModels";
export class IngestionSchemaV2 implements ISchemaGenerator{
    private regex: RegExp = /\./g;
    private ingestionConfig: IngestionConfig;
    private dataSet: string;
    private indexCol: string;

    constructor(dataSet: string, config: IngestionConfig) {
        this.dataSet = dataSet
        this.ingestionConfig = config;
        this.indexCol = config.indexCol
    }
    generate(sample: Map<string, any>): any {
        const simplifiedSpec = this.generateExpression(sample.get("properties"))
        const generatedSpec = this.process(simplifiedSpec)
        const ingestionSpec = this.getIngestionTemplate(generatedSpec.flattenSpec, generatedSpec.dimensions, generatedSpec.metrics)
        return ingestionSpec
    }
    
    process(sample: Map<string, any>): IngestionSpecModel {
        const metrics = this.filterMetricsCols(sample)
        const dims = this.filterDimsCols(sample)
        var flattenSpec = _.merge(this.getObjByKey(dims, "flattenSpec"), this.getObjByKey(metrics, "flattenSpec"));
        return <IngestionSpecModel>{
            "dimensions": this.getObjByKey(dims, "dimensions"),
            "metrics": this.updateMetricsCols(metrics),
            "flattenSpec": flattenSpec
        }
    }

    private getObjByKey(sample: any, key: string) {
        return _.map(sample, (value, keys) => { return value[key] })
    }

    private updateMetricsCols(sample: any) {
        const metricCols = _.map(sample, (value, keys) => {
            return value["dimensions"]
        })
        return metricCols.map((value, key) => {
            value["fieldName"] = value["name"]
            return value
        })
    }

    private filterMetricsCols(sample: Map<string, any>): any[] {
        const metricsType = ["doubleSum"]
        return Array.from(sample.values()).filter((item: any) => _.includes(metricsType, item["propert_type"]));
    }

    private filterDimsCols(sample: Map<string, any>): any[] {
        const metricsType = ["doubleSum"]
        return Array.from(sample.values()).filter((item: any) => !_.includes(metricsType, item["propert_type"]));
    }

    private generateExpression(sample: Map<string, any>): Map<string, any> {
        let map = new Map();
        const recursive = (data: any, path: string) => {
            _.forEach(data, (value, key) => {
                if (_.isPlainObject(value) && (_.has(value, 'properties'))) {
                    recursive(value['properties'], `${path}.${key}`);
                } else {
                    if (_.isPlainObject(value)) {
                        if (value.type === 'array') {
                            if (_.has(value, 'items') && _.has(value["items"], 'properties')) {
                                recursive(value["items"]['properties'], `${path}.${key}[*]`);
                            } else {
                                map.set(`${path}_${key}`, this.createSpecObj(`${path}.${key}[*]`, this.getObjectType(key, value.type), `${path}_${key}`))
                            }
                        }else if(value.type == 'object' && (!_.has(value, 'properties'))){
                            console.warn(`Found empty object without properties in the schema..Key: ${key}, Object: ${JSON.stringify(value)}`)
                        }
                         else {
                            map.set(`${path}_${key}`, this.createSpecObj(`${path}.${key}`, this.getObjectType(key, value.type), `${path}_${key}`))
                        }
                    }
                }

            })
        }
        recursive(sample, "$")
        return map
    }

    private createSpecObj(expr: string, objType: string, name: string): any {
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

    private getObjectType(key: string, type: string): string {
        switch (type) {
            case "integer": {
                return ((key != this.indexCol)) ? "doubleSum" : "timestamp"
            }
            default: {
                return type
            }
        }
    }

    private getIngestionTemplate(flattenSpec: any, dims: any, metrics: any): any {
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
                    "maxRowsPerSegment": this.ingestionConfig.tuningConfig?.maxRowPerSegment || 1000,
                    "logParseExceptions": true
                },
                "ioConfig": this.getIOConfigObj(flattenSpec)
            }
        }
    }

    private getGranularityObj(): any {
        return {
            "type": "uniform",
            "segmentGranularity": this.ingestionConfig.granularitySpec.segmentGranularity,
            "queryGranularity": this.ingestionConfig.granularitySpec.queryGranularity,
            "rollup": this.ingestionConfig.granularitySpec.rollup
        }
    }

    private getIOConfigObj(flattenSpec: any): any {
        return {
            "type": "kafka",
            "topic": this.ingestionConfig.ioConfig?.topic,
            "consumerProperties": { "bootstrap.servers": this.ingestionConfig.ioConfig?.bootstrapIp },
            "taskCount": this.ingestionConfig.tuningConfig?.taskCount,
            "replicas": 1,
            "taskDuration": this.ingestionConfig.ioConfig?.taskDuration,
            "useEarliestOffset": false,
            "completionTimeout": "PT8H",
            "inputFormat": { "type": "json", "flattenSpec": { "useFieldDiscovery": true, "fields": flattenSpec } },
            "appendToExisting": false
        }
    }
}


<<<<<<< HEAD
//         const flattenSpec = _.uniqBy(_.flatMap(generatedSpec, (value, key) => {
//             return value.flattenSpec
//         }), "name")


//         return this.getIngestionTemplate(flattenSpec, dims, metrics)
//     }

//     /**
//      * Method to process the sample rquest
//      * 
//      * @param sample - Map<string, any>
//      * @returns - IngestionSpecModel
//      */
//     process(sample: Map<string, any>): IngestionSpecModel {

//         const simplifiedSpec = this.generateExpression(sample)
//         const metrics = this.filterMetricsCols(simplifiedSpec)

//         const dims = this.filterDimsCols(simplifiedSpec)

//         var flattenSpec = _.merge(this.getObjByKey(dims, "flattenSpec"), this.getObjByKey(metrics, "flattenSpec"));

//         return <IngestionSpecModel>{
//             "dimensions": this.getObjByKey(dims, "dimensions"),
//             "metrics": this.updateMetricsCols(metrics),
//             "flattenSpec": flattenSpec
//         }

//     }

//     getObjByKey(sample: any, key: string) {
//         return _.map(sample, (value, keys) => { return value[key] })
//     }

//     updateMetricsCols(sample: any) {
//         const metricCols = _.map(sample, (value, keys) => {
//             return value["dimensions"]
//         })
//         return metricCols.map((value, key) => {
//             value["fieldName"] = value["name"]
//             return value
//         })
//     }

//     filterMetricsCols(sample: Map<string, any>): any[] {
//         const metricsType = ["doubleSum"]
//         return Array.from(sample.values()).filter((item: any) => _.includes(metricsType, item["propert_type"]));
//     }

//     filterDimsCols(sample: Map<string, any>): any[] {
//         const metricsType = ["doubleSum"]
//         return Array.from(sample.values()).filter((item: any) => !_.includes(metricsType, item["propert_type"]));
//     }

//     generateExpression(sample: Map<string, any>): Map<string, any> {
//         let map = new Map();
//         const recursive = (data: any, path: string) => {
//             _.forEach(data, (value, key) => {
//                 if (_.isPlainObject(value)) {
//                     recursive(value, `${path}.${key}`);
//                 } else if (this.getObjectType(value, key) === "array") {
//                     if (this.isComplexArray(value)) { // defines simple array or complex array
//                         let mergedResult = _.assign.apply(_, value)
//                         recursive(mergedResult, `${path}.${key}[*]`);
//                     } else {
//                         map.set(`${path}_${key}`, this.createSpecObj(`${path}.${key}[*]`, this.getObjectType(value, key), `${path}_${key}`))
//                     }
//                 }
//                 else {
//                     map.set(`${path}_${key}`, this.createSpecObj(`${path}.${key}`, this.getObjectType(value, key), `${path}_${key}`))
//                 }
//             })
//         }
//         recursive(sample, "$")
//         return map
//     }

//     createSpecObj(expr: string, objType: string, name: string): any {
//         return {
//             "flattenSpec": {
//                 "type": "path",
//                 "expr": expr,
//                 "name": _.replace(name.replace(this.regex, "_"), "$_", "")
//             },
//             "dimensions": {
//                 "type": objType,
//                 "name": _.replace(name.replace(this.regex, "_"), "$_", "")
//             },
//             "propert_type": objType
//         }
//     }

//     isComplexArray(sample: any[]): boolean {
//         let obj = _.head(_.uniq(_.map(sample, (value, key) => {
//             return typeof value
//         })))
//         return _.isEqual(obj, typeof {}) ? true : false
//     }

//     getObjectType(obj: any, key: string): string {
//         switch (typeof obj) {
//             case "object": {
//                 return _.isArray(obj) ? "array" : "object"
//             }
//             case "number": {
//                 return (_.isNumber(obj) && (key!= this.indexCol)) ? "doubleSum" : "timestamp"
//             }
//             default: {
//                 return typeof obj
//             }
//         }
//     }

//     getIngestionTemplate(flattenSpec: any, dims: any, metrics: any): any {
//         return {
//             "type": "kafka",
//             "spec": {
//                 "dataSchema": {
//                     "dataSource": this.dataSet,
//                     "dimensionsSpec": { "dimensions": dims },
//                     "timestampSpec": { "column": this.indexCol, "format": "auto" },
//                     "metricsSpec": metrics,
//                     "granularitySpec": this.getGranularityObj()
//                 },
//                 "tuningConfig": {
//                     "type": "kafka",
//                     "maxRowsPerSegment": this.ingestionConfig.tuningConfig.maxRowPerSegment,
//                     "logParseExceptions": true
//                 },
//                 "ioConfig": this.getIOConfigObj(flattenSpec)
//             }
//         }
//     }

//     getGranularityObj(): any {
//         return {
//             "type": "uniform",
//             "segmentGranularity": this.ingestionConfig.granularitySpec.segmentGranularity,
//             "queryGranularity": this.ingestionConfig.granularitySpec.queryGranularity,
//             "rollup": this.ingestionConfig.granularitySpec.rollup
//         }
//     }

//     getIOConfigObj(flattenSpec: any): any {
//         return {
//             "type": "kafka",
//             "topic": this.ingestionConfig.ioConfig.topic,
//             "consumerProperties": { "bootstrap.servers": this.ingestionConfig.ioConfig.bootstrapIp },
//             "taskCount": this.ingestionConfig.tuningConfig.taskCount,
//             "replicas": 1,
//             "taskDuration": this.ingestionConfig.ioConfig.taskDuration,
//             "useEarliestOffset": false,
//             "completionTimeout": "PT8H",
//             "inputFormat": { "type": "json", "flattenSpec": { "useFieldDiscovery": true, "fields": flattenSpec } },
//             "appendToExisting": false
//         }
//     }
// }

// export { IngestionConfig };
=======
>>>>>>> origin/ingestion-spec-generation
