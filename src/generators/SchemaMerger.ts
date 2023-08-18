import * as _ from "lodash";
export class SchemaMerger {

    mergeSchema(schema: any, schema2: any): Map<string, any> {
        return _.merge(schema, schema2);
    }
}
