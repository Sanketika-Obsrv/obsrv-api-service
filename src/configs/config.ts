export const config = {
  "api_port": process.env.api_port || 3000,

  "validation": {
    "limits": "",

  },
  "query_api": {
    "druid": {
      "host": process.env.druid_host || "http://localhost",
      "port": process.env.druid_port || 8888,
      "status_api": "/status",
      "health_api": "/status/health",
      "sql_query_path": "/druid/v2/sql/",
      "native_query_path": "/druid/v2/"
    }
  },
  "rules": {
    "storage": "local",
    "path": ""
  },

  "schema_api": {


  },

  "manage_api": {

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
        "connectionTimeout": 1000
      },
      "topics": {
        "create": "telemetry.input",
        "mutate": "telemetry.mutate"
      }

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
  }
}





