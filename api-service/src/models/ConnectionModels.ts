
export interface DbConfig {
    host: string;
    port: string | number;
    database: string;
    user: string;
    password: string;
}

export interface DbConnectorConfig {
    client: string;
    connection: DbConfig;
}
