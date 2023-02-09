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
    dataSet: string,
    indexCol: string,
    granularitySpec: GranularitySpec,
    tuningConfig?: TuningConfig,
    ioConfig?: IOConfig
}

export interface IngestionSchemeRequest {
    schema: Map<string, any>[],
    config: IngestionConfig
}

export interface DataSchemeRequest {
    data: Map<string, any>[],
    config: IngestionConfig
}

export interface ISchemaGenerator {
    generate: ((sample: Map<string, any>) => any) |
    ((sample: Map<string, any>[]) => any);
    process: ((sample: Map<string, any>) => any) |
    ((sample: Map<string, any>[]) => any);
}

export interface IConnector {
    connect(): any;
    execute(sample: string, ...args: any): any;
    close(): any
}
