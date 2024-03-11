
const env = process.env;

export const connectionConfig = {
    postgres: {
        host: env.postgres_host || 'localhost',
        port: env.postgres_port || 5432,
        database: env.postgres_database || 'obsrv',
        username: env.postgres_username || 'postgres',
        password: env.postgres_password || 'postgres',
    },
    kafka: {
        "config": {
            "brokers": [`${env.kafka_host || 'localhost'}:${env.kafka_port || 9092}`],
            "clientId": env.client_id || "obsrv-apis",
            "retry": {
                "initialRetryTime": env.kafka_initial_retry_time ? parseInt(env.kafka_initial_retry_time) : 3000,
                "retries": env.kafka_retries ? parseInt(env.kafka_retries) : 1
            },
            "connectionTimeout": env.kafka_connection_timeout ? parseInt(env.kafka_connection_timeout) : 5000
        },
        "topics": {
            "createDataset": `${env.system_env || 'local'}.ingest`,
            "createMasterDataset": `${env.system_env || 'local'}.masterdata.ingest`
        }
    }
}