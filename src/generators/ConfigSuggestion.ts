import _ from "lodash";
import { datasetIngestionDefaultConfig, datasetProcessingDefaultConfigs, datasetQueryDefaultConfig } from "../configs/schemas/DatasetConfigs";


import { DataSetConfig, DatasetProcessing } from "../models/ConfigModels";
import { IngestionConfig } from "../models/IngestionModels";
import { ILimits } from "../models/QueryModels";
import { ConflictTypes } from "../models/SchemaModels";

export class ConfigSuggestionGenerator {
    /**
     * Responsiblities : 
     *  1. Suggest rollup is required or not. - done
     *  2. Suggest the dedup property field. - done
     *  3. Return Basic druid configurations, processing configuration and querying configuration - done
     */

    public suggestConfig(conflicts: ConflictTypes[]): DataSetConfig {
        const suggestedConfig = this.analyzeConflicts(conflicts)
        return suggestedConfig
    }

    private analyzeConflicts(conflicts: ConflictTypes[]): DataSetConfig {
        const typeFormatsConflict: ConflictTypes[] = _.filter(conflicts, (o) => !_.isEmpty(o.formats));
        const ingestionConfig: IngestionConfig = this.ingestionConfig(typeFormatsConflict)
        const processingConfig: DatasetProcessing = this.processingConfig(typeFormatsConflict)
        const queryingConfig: ILimits = this.queryingConfig(typeFormatsConflict)
        return <DataSetConfig>{ "querying": queryingConfig, "ingestion": ingestionConfig, "processing": processingConfig }
    }

    private ingestionConfig(conflicts: ConflictTypes[]): IngestionConfig {
        const uuidConflicts = _.filter(conflicts, (o) => !_.isEmpty(o.formats.conflicts) && o.formats.conflicts.hasOwnProperty('uuid'));
        const isRollupRequired = _.isEmpty(uuidConflicts) ? true : false
        const dateSchemaFormat = ["date", "date-time"]
        const indexCol = this._getProperty(conflicts, dateSchemaFormat)
        var ingestionConfig = this.getDefaultIngestionConfig()
        ingestionConfig.granularitySpec.rollup = isRollupRequired
        if (!_.isEmpty(indexCol)) ingestionConfig.indexCol = indexCol;
        return ingestionConfig
    }

    private processingConfig(conflicts: ConflictTypes[]): DatasetProcessing {
        const dateSchemaFormat = ["uuid"]
        const dedupCol = this._getProperty(conflicts, dateSchemaFormat)
        var processingConfig = this.getDefaultProcessingConfig()
        processingConfig.dedup_config.dedup_key = dedupCol
        return processingConfig
    }

    private queryingConfig(conflicts: ConflictTypes[]): ILimits {
        return this.getDefaultQueryingConfig()
    }

    private _getProperty(conflicts: ConflictTypes[], list: string[]) {
        return _.first(_(conflicts)
            .filter((obj) => {
                const conflictKey = Object.keys(obj.formats.conflicts)[0];
                return _.includes(list, conflictKey);
            })
            .sortBy((obj) => -obj.formats.conflicts[Object.keys(obj.formats.conflicts)[0]])
            .value().map(key => key.formats.property)) || ""
    }

    private getDefaultIngestionConfig(): IngestionConfig {
        return <IngestionConfig>datasetIngestionDefaultConfig
    }

    private getDefaultProcessingConfig(): DatasetProcessing {
        return <DatasetProcessing>datasetProcessingDefaultConfigs
    }

    private getDefaultQueryingConfig(): ILimits {
        return <ILimits>datasetQueryDefaultConfig
    }
}