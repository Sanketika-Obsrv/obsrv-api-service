
const env = process.env;

export const connectionConfig = {
    postgres: {
        host: process.env.postgres_host || 'localhost',
        port: process.env.postgres_port || 5432,
        database: process.env.postgres_database || 'obsrv',
        username: process.env.postgres_username || 'postgres',
        password: process.env.postgres_password || 'postgres',
    },
    kafka: {
        "config": {
            "brokers": [`${process.env.kafka_host || 'localhost'}:${process.env.kafka_port || 9092}`],
            "clientId": process.env.client_id || "obsrv-apis",
            "retry": {
                "initialRetryTime": process.env.kafka_initial_retry_time ? parseInt(process.env.kafka_initial_retry_time) : 3000,
                "retries": process.env.kafka_retries ? parseInt(process.env.kafka_retries) : 1
            },
            "connectionTimeout": process.env.kafka_connection_timeout ? parseInt(process.env.kafka_connection_timeout) : 5000
        },
        "topics": {
            "createDataset": `${process.env.system_env || 'local'}.ingest`,
            "createMasterDataset": `${process.env.system_env || 'local'}.masterdata.ingest`
        }
    }
}