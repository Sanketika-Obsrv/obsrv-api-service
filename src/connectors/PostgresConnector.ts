
import { ClientConfig, Pool, QueryResult } from "pg";
import { IConnector } from "../models/ingestionModels";
 
export class PostgresConnector implements IConnector {
    private config: ClientConfig
    private pool: Pool

    constructor(config: ClientConfig) {
        this.config = config;
        this.pool = new Pool(this.config)
    }

    async connect() {
        await this.pool.connect()
            .then(() => console.info("Postgres Connection Established..."))
            .catch((err) => console.error(`Postgres Connection failed ${err}`))
    }

    async close() {
        return await this.pool.end()
    }

    async execute(query: string): Promise<QueryResult<any>> {
        try {
            return await this.pool.query(query)
        } catch (err: any) {
            console.log(err.stack)
            return err
        }
    }
}
