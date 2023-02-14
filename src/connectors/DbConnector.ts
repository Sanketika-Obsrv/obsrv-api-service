import knex, { Knex } from "knex";
import { IConnector } from "../models/DatasetModels";


export class DbConnector implements IConnector {
    private config: any // Def
    private pool: Knex
    constructor(config: any) {
        this.config = config;
        this.pool=knex(this.config)
    }

    async connect() {
        //TODO
    }

    async close() {
        //TODO   
    }

    async execute(query: string) {
        //TODO
    }

    async insertRecord(tableName: string, values: any) {
        await this.pool(tableName).insert(values)
    }
}



 