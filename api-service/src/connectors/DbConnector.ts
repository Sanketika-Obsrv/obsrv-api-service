import knex, { Knex } from "knex";
import { IConnector } from "../models/DatasetModels";
import { DbConnectorConfig } from "../models/ConnectionModels";
import { SchemaMerger } from "../generators/SchemaMerger";
import constants from '../resources/Constants.json'
import { config as appConfig } from "../configs/Config"
import _ from 'lodash'
import { wrapperService } from "../routes/Router";
const schemaMerger = new SchemaMerger()
export class DbConnector implements IConnector {
    public pool: Knex
    private config: DbConnectorConfig
    public typeToMethod = {
        insert: this.insertRecord,
        update: this.updateRecord,
        read: this.readRecords,
        upsert: this.upsertRecord,
    }
    public method: any
    constructor(config: DbConnectorConfig) {
        this.config = config;
        this.pool = knex(this.config)
    }
    public init = () => {
        this.connect()
            .then(() => console.info("Database Connection Established..."))
            .catch((err: Error) => console.error(`Database Connection failed: ${err.message}`))
    }

    async connect() {
        await this.pool.select(1)
    }

    async close() {
        return await this.pool.destroy()
    }

    execute(type: keyof typeof this.typeToMethod, property: any) {
        this.method = this.typeToMethod[ type ]
        return this.method(property[ "table" ], property[ "fields" ])
    }

    public async insertRecord(table: string, fields: any) {
        await this.pool.transaction(async (dbTransaction) => {
            await this.submit_ingestion(_.get(fields, 'ingestion_spec'), table)
            await dbTransaction(table).insert(fields)
        })
    }

    public async updateRecord(table: string, fields: any) {
        const { filters, values } = fields
        await this.pool.transaction(async (dbTransaction) => {
            const currentRecord = await dbTransaction(table).select(Object.keys(values)).where(filters).first()
            if (_.isUndefined(currentRecord)) { throw constants.FAILED_RECORD_UPDATE }
            if (!_.isUndefined(currentRecord.tags)) { delete currentRecord.tags }
            await dbTransaction(table).where(filters).update(schemaMerger.mergeSchema(currentRecord, values))
        })
    }

    public async upsertRecord(table: string, fields: any) {
        const { filters, values } = fields;
        const existingRecord = await this.pool(table).select().where(filters).first()
        if (!_.isUndefined(existingRecord)) {
            await this.pool.transaction(async (dbTransaction) => {
                await this.submit_ingestion(_.get(values, 'ingestion_spec'), table)
                await dbTransaction(table).where(filters).update(schemaMerger.mergeSchema(existingRecord, values))
            })
        } else {
            await this.pool.transaction(async (dbTransaction) => {
                await this.submit_ingestion(_.get(values, 'ingestion_spec'), table)
                await dbTransaction(table).insert(values)
            })
        }
    }

    public async readRecords(table: string, fields: any) {
        const query = this.pool.from(table).select().where((builder) => {
            const filters = fields.filters || {};
            if (filters.status) {
                if (Array.isArray(filters.status) && filters.status.length > 0) {
                    builder.whereIn("status", filters.status);
                } else if (filters.status.length > 0) {
                    builder.where("status", filters.status);
                }
            }
            delete filters.status;
            builder.where(filters);
        })
        return await query
    }

    public async listRecords(table: string) {
        return await this.pool.select('*').from(table)
    }

    private async submit_ingestion(ingestion_spec: Record<string, any>, table: string) {
        if (appConfig.table_names.datasources === table) {
            return await wrapperService.submitIngestion(ingestion_spec)
                .catch((error: any) => {
                    console.error(constants.INGESTION_FAILED_ON_SAVE)
                    throw constants.FAILED_RECORD_UPDATE
                })
        }
        return
    }
}