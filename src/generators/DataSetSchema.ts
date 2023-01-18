import _ from "lodash";
import { ISchemaGenerator } from "../models/ingestionModels";

import { inferSchema } from "@jsonhero/schema-infer";
export class DataSetSchema implements ISchemaGenerator {
    private config: Map<string, any>;
    private dataset: string;

    constructor(dataset: string, config: Map<string, any>) {
        this.config = config;
        this.dataset = dataset
    }

    generate(sample: Map<string, any>[]): any {
        const mergedSample = _.reduce(sample, _.extend)
        return inferSchema(mergedSample).toJSONSchema()
    }

    process(sample: Map<string, any>) {
        throw new Error("Method not implemented.");
    }
    

}