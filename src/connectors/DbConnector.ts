import knex, { Knex } from "knex";
import { IConnector } from "../models/DatasetModels";
import { DbConnectorConfig } from "../models/DatabaseOperationModels";


export class DbConnector implements IConnector {
    private config: DbConnectorConfig
    private pool: Knex
    constructor(config: any) {
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

    async insertRecord(tableName: string, values: any) {
        await this.pool(tableName).insert(values)
    }

    async updateRecord(tableName: string, id: string, values: any) {
        await this.pool(tableName).where('id', '=', id).update(values)
    }

    async readRecord(tableName: string, id: string) {
        return await this.pool.from(tableName).select().where('id', "=", id)
    }
}