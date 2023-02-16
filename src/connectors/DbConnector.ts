import knex, { Knex } from "knex";
import { IConnector } from "../models/DatasetModels";
import { DbConnectorConfig } from "../models/DatabaseOperationModels";

type filter = {
    column: string,
    value: any
}

export class DbConnector implements IConnector {
    private config: DbConnectorConfig
    private pool: Knex
    constructor(config: DbConnectorConfig) {
        this.config = config;
        this.pool = knex(this.config)
    }

    async connect() {
        throw new Error("Method not implemented.");

    }

    async close() {
        throw new Error("Method not implemented.");

    }

    async execute(query: string) {
        throw new Error("Method not implemented.");

    }

    async insertRecord(tableName: string, values: object) {
        await this.pool(tableName).insert(values)
    }

    async updateRecord(tableName: string, filters: filter, values: object) {
        await this.pool(tableName).where(filters.column, '=', filters.value).update(values)
    }

    async readRecord(tableName: string, filters: filter) {
        return await this.pool.from(tableName).select().where(filters.column, '=', filters.value)
    }
}