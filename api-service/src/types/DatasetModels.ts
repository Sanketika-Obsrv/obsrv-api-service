import { ValidationStatus } from "./ValidationModels";

export interface ISchemaGenerator {
    generate: ((sample: Map<string, any>) => any) |
    ((sample: Map<string, any>[]) => any);
    process: ((sample: Map<string, any>) => any) |
    ((sample: Map<string, any>[]) => any);
}
export interface IConnector {
    connect(): any;
    execute(sample: any, type?: any, topic?: any): any;
    executeSql(sql: string[]): any;
    close(): any
}

// Interface with method for request body validation
export interface IValidator {
    // Method to perform validation on the request body of a request
    validate(data: any, id?: string): ValidationStatus | Promise<ValidationStatus>;
}

// Interface with method for request params validation
export interface QValidator extends IValidator {
    // Method to perform validation on the query params of a request
    validateQueryParams(data: any, id?: string): ValidationStatus | Promise<ValidationStatus>;
}

export interface Params {
    status: string,
    resmsgid: string,
    msgid: string,
}
export interface IResponse {
    id: string,
    ts: string,
    ver: string,
    params: Params,
    responseCode: string,
    result: any
}

export interface Result {
    data: object;
    status: number;
}

export enum DatasetStatus {
    Live = "Live", Retired = "Retired", Draft = "Draft", ReadyToPublish = "ReadyToPublish", Archived = "Archived"
}

export enum TransformationMode {
    Strict = "Strict", Lenient = "Lenient",
}

export enum ValidationMode {
    Strict = "Strict", IgnoreNewFields = "IgnoreNewFields", DiscardNewFields = "DiscardNewFields",
}

export enum DatasetType {
    event = "event", master = "master", transaction = "transaction"
}

export enum DatasetAction {
    Retire = "Retire", Delete = "Delete", ReadyToPublish = "ReadyToPublish", Live="Live"
}

export enum HealthStatus {
    Healthy = "Healthy", UnHealthy= "UnHealthy"
}

export enum DataSourceType {
    druid = "druid"
}