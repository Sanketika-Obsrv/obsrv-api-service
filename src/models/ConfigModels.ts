import { IngestionConfig } from "./ingestionModels";
import { ILimits } from "./QueryModels";

export interface ProcessingConfig {
    checkpointingInterval: number,
    dedupProperty: string,
    dedupRetentionPeriod: number,
    consumerParallelism: number,
    downstreamParallelism: number,
    dataSize: number
}

export interface DataSetConfig {
    querying: ILimits
    ingestion: IngestionConfig,
    processing: ProcessingConfig
}