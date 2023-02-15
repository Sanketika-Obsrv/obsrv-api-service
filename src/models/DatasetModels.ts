import { ValidationStatus } from "./ValidationModels";

export interface ISchemaGenerator {
    generate: ((sample: Map<string, any>) => any) |
    ((sample: Map<string, any>[]) => any);
    process: ((sample: Map<string, any>) => any) |
    ((sample: Map<string, any>[]) => any);
}
export interface IConnector {
    connect(): any;
    execute(sample: string): any;
    close(): any
}

export interface IValidator {
    validate(data: any, id?: string): ValidationStatus;
}

export interface Params {
    status: string,
    errmsg: string
}
export interface IResponse {
    id: string,
    ts: number,
    ver: string,
    params: Params,
    responseCode: string,
    result: any
}

export interface Result {
    data: object;
    status: number;
}

