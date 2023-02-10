
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