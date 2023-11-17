export interface IngestionSpecModel {
    dimensions: any,
    metrics: any,
    flattenSpec: any
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

export interface IConnector {
    connect(): any;
    execute(sample: string, ...args: any): any;
    close(): any
}
