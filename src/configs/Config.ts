export const config = {
  "api_port": process.env.api_port || 3000,

  "query_api": {
    "druid": {
      "host": process.env.druid_host || "http://localhost",
      "port": process.env.druid_port || 8888,
      "sql_query_path": "/druid/v2/sql/",
      "native_query_path": "/druid/v2"
    }
  },

  "postgres": {
    "pg_config": {
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'manjunathdavanam',
      password: 'Manju@123',
    }
  },

  "dataset_api": {
    "kafka": {
      "config": {
        "brokers": ["localhost:9092"],
        "clientId": "obsrv-apis",
        "retry": {
          "initialRetryTime": 1000,
          "retries": 3
        },
        "connectionTimeout": 3000
      },
      "topics": {
        "create": "telemetry.ingest",
        "mutate": "telemetry.mutate"
      }

    }

  },
  "db_connector_config": {
    client: "postgresql",
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'manjunathdavanam',
      password: 'Manju@123',
    }
  }

}