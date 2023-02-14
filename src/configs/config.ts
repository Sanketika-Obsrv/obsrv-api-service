import { queryRules } from "./queryRules";

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
          "retries": 1
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
  },


  "db_connector_config": {
    client: 'postgresql',
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'manjunathdavanam',
      password: 'Manju@123',
    },
    pool: {
      min: 2,
      max: 10,
    }
  }



  // datasetConfig: {
  //   ingestion: {
  //     dataset: "observ-demo",
  //     indexCol: "ets",
  //     granularitySpec: {
  //       segmentGranularity: "DAY",
  //       queryGranularity: "hour",
  //       rollup: true
  //     },

  //   },
  //   querying: queryRules,
  //   processing: {
  //     topic: "",
  //     extraction: {
  //       is_batch_event: false,
  //       extraction_key: "events",
  //       dedup_config: {
  //         drop_duplicates: false,
  //         dedup_key: "",
  //         dedup_period: 1400
  //       }
  //     },
  //     dedup_config: {
  //       drop_duplicates: false,
  //       dedup_key: "",
  //       dedup_period: 1400
  //     },
  //     validation_config: {
  //       validate: true,
  //       mode: ""
  //     },
  //     denorm_config: {
  //       redis_db_host: "",
  //       redis_db_port: "",
  //       denorm_fields: {
  //         denorm_key: "",
  //         redis_db: 1,
  //         denorm_out_field: "metadata"
  //       }
  //     },
  //     router_config: {
  //       topic: ""
  //     }
  //   }
  // }
}