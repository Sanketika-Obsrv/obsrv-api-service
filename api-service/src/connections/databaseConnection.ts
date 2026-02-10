import { Sequelize } from "sequelize";
import { connectionConfig } from "../configs/ConnectionsConfig"

const { database, host, port } = connectionConfig.postgres;
const credentials = connectionConfig.postgres.credentials.split("::");

const decodedCredentials = Buffer.from(credentials[1], 'base64').toString('utf-8');

export const sequelize = new Sequelize(
    database,
    credentials[0],
    decodedCredentials,
    {
        host,
        port: +port,
        dialect: "postgres",
        pool: {
            max: 2,
            min: 1,
            acquire: 30000,
            idle: 10000
        }
    }
)

 export const health = async () => {
    return sequelize.query("select 1")
}

export const query = async (query: string) => {
    const [results, metadata] = await sequelize.query(query)
    return {
        results, metadata
    }
}