export const config = {
  "api_port": process.env.api_port || 3000,
  "validation": {
    "request": process.env.druid_host || "http://localhost",
  },
  "query_api": {
    "druid": {
      "host": process.env.druid_host || "http://localhost",
      "port": process.env.druid_port || 8888,
      "status_api": "/status",
      "health_api": "/status/health",
      "sql_query_path": "/druid/v2/sql/",
      "native_query_path": "/druid/v2"
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
      "brokers": ["localhost:9092"],
      "topics": {
        "create": "telemetry.input",
        "mutate": "telemetry.mutate"
      }

    }

  }
}





