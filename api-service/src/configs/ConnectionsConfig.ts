
const env = process.env;

export const connectionConfig = {
    postgres: {
        host: process.env.postgres_host || 'localhost',
        port: process.env.postgres_port || 5432,
        database: process.env.postgres_database || 'obsrv',
        username: process.env.postgres_username || 'postgres',
        password: process.env.postgres_password || 'postgres',
    }
}