import { IngestionConfig } from "./IngestionModels";
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


export interface SchemaUpdate {
    property: string,
    conflictType: string,
    objectType: string
    action: string
}

export interface ConflictSchema {
    property: string,
    type: string,
    conflicts: any,
    resolution:any

}

export interface Suggestions {
    schema: ConflictSchema;
    required: ConflictSchema;
    fullPath:string;
}

export interface ObjectType {
    property: string;
    objectType: string;
    isRequired: boolean;
    path: string;
    fullPath: string;
  }