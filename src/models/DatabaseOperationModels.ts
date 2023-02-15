import exp from "constants";

export interface DbConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
}

export interface DbConnectorConfig {
    client: string;
    connection: DbConfig;
}

export interface DatasetInsertRequest {
    dataSet: string;
    version: string;
    validationConfig: object;
    extractionConfig: object;
    dedupConfig:object;
    jsonSchema: object;
    denormConfig: object;
    routerConfig:object;
    status: string;
    createdBy: string;
    updatedBy: string;
}

export interface DatasourceInsertRequest {
    id: string;
    dataSetId: string;
    ingestionSpec: object;
    dataSource: string
    retentionPeriod: object;
    archivalPolicy: object;
    purgePolicy:object;
    backupConfig: object;
    denormConfig: object;
    status: string;
    createdBy: string;
    updatedBy: string;
}