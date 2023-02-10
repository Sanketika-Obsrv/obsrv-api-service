import { ClientConfig, Pool, QueryResult } from "pg";
<<<<<<< HEAD
import { IConnector } from "../models/ingestionModels";

=======
import { IConnector } from "../models/DataSetModels";
>>>>>>> origin/ingestion-spec-generation
export class PostgresConnector implements IConnector {
    private config: ClientConfig
    public pool: Pool

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
        return await this.pool.query(query)
    }
}
