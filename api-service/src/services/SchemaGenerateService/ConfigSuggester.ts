import _ from "lodash";
import { DataSetConfig, DatasetProcessing } from "../../types/ConfigModels";
import { IngestionConfig, RollupInfo } from "../../types/IngestionModels";
import { ConflictTypes } from "../../types/SchemaModel";
import { ingestionConfig } from "../../configs/IngestionConfig";
import { parseSchemaPath } from "./SchemaGeneratorUtils";


export const defaultLabels = {
    dropDuplicates: ["Yes", "No"]
}

export class ConfigSuggestor {
    /**
     * Responsiblities : 
     *  1. Suggest rollup is required or not. - done
     *  2. Suggest the dedup property fields. - done
     */
    private dataset: string
    private rollupInfo: RollupInfo
    constructor(dataset: string) {
        this.dataset = dataset
        this.rollupInfo = {}
    }

    public suggestConfig(conflicts: ConflictTypes[], rollupInfo: RollupInfo): DataSetConfig {
        this.rollupInfo = rollupInfo
        const suggestedConfig = this.analyzeConflicts(conflicts)
        return suggestedConfig
    }

    private analyzeConflicts(conflicts: ConflictTypes[]): DataSetConfig {
        const typeFormatsConflict: ConflictTypes[] = _.filter(conflicts, (o) => !_.isEmpty(o.formats));
        const ingestionConfig: IngestionConfig = this.ingestionConfig()
        const processingConfig: DatasetProcessing = this.processingConfig(typeFormatsConflict)
        return <DataSetConfig>{ "indexConfiguration": ingestionConfig, "processing": processingConfig }
    }

    private ingestionConfig(): any {
        return { "index": Object.assign(ingestionConfig.indexCol), "rollupSuggestions": this.rollupInfo };
    }

    private processingConfig(conflicts: ConflictTypes[]): any {
        let dedupKeys = _.filter(conflicts, (o) => _.upperCase(o.formats.resolution["type"]) === "DEDUP").map(v => v.formats.property)
        let matchedDedupFields = []
        const dedupOrderProperty = "cardinality"
        const dedupOrder: any = "desc"
        if (!_.isUndefined(this.rollupInfo.summary)) {
            for (const key of Object.keys(this.rollupInfo.summary)) {
                if (!this.rollupInfo.summary[key].index) {
                    for (const dedupKey of dedupKeys) {
                        if (dedupKey == parseSchemaPath(this.rollupInfo.summary[key].path)) matchedDedupFields.push(this.rollupInfo.summary[key])
                    }
                }
            }
            matchedDedupFields = _.orderBy(matchedDedupFields, dedupOrderProperty, dedupOrder)
            dedupKeys = _.map(matchedDedupFields, matchedDedupField => parseSchemaPath(matchedDedupField.path));
        }
        return { "dedupKeys": dedupKeys, dropDuplicates: defaultLabels.dropDuplicates }
    }
}
