export interface IngestionSpecModel {
    dimensions: Record<string, any>,
    metrics: Record<string, any>,
    flattenSpec: Record<string, any>
}

interface FlattenSpecObject {
    "type": string,
    "expr": string,
    "name": string
}

interface DimensionsSpecObject {
    "type": string,
    "name": string
}

export interface IngestionSpecObject {
    "flattenSpec": FlattenSpecObject,
    "dimensions": DimensionsSpecObject,
    "fieldType": string
}

export interface IOConfig {
    topic: string,
    bootstrapIp: string,
    taskDuration: string,
    completionTimeout: string
}
export interface TuningConfig {
    maxRowPerSegment: number,
    taskCount: number,
}

export interface GranularitySpec {
    segmentGranularity: string,
    queryGranularity: string,
    rollup: boolean
}

export interface IngestionConfig {
    dataset: string,
    indexCol: string,
    granularitySpec: GranularitySpec,
    tuningConfig?: TuningConfig,
    ioConfig?: IOConfig
}

export interface IngestionSchemeRequest {
    schema: Map<string, any>[],
    config: IngestionConfig
}
