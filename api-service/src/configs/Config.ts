// These configurations provide settings and values for various aspects of dataset management, data ingestion, and table configurations in a system.

const env = process.env.system_env || "local"

export const config = {
  "env": env,
  "api_port": process.env.api_port || 3000,
  "body_parser_limit": process.env.body_parser_limit || "100mb",
  "version": "1.0",
  "query_api": {
    "druid": {
      "host": process.env.druid_host || "http://localhost",
      "port": process.env.druid_port || 8888,
      "sql_query_path": "/druid/v2/sql/",
      "native_query_path": "/druid/v2",
      "list_datasources_path": "/druid/v2/datasources",
      "submit_ingestion": "druid/indexer/v1/supervisor"
    }
  },
  "db_connector_config": {
    client: "postgresql",
    connection: {
      host: process.env.postgres_host || 'localhost',
      port: process.env.postgres_port || 5432,
      database: process.env.postgres_database || 'sb-obsrv',
      user: process.env.postgres_username || 'obsrv',
      password: process.env.postgres_password || '5b-0b5rv',
    }
  },
  "telemetry_service_config": {
    level: process.env.telemetry_log_level || 'info',
    localStorageEnabled: process.env.telemetry_local_storage_enabled || 'true',
    dispatcher: process.env.telemetry_local_storage_type || 'kafka',
    telemetryProxyEnabled: process.env.telemetry_proxy_enabled,
    proxyURL: process.env.telemetry_proxy_url,
    proxyAuthKey: process.env.telemetry_proxy_auth_key,
    compression_type: process.env.telemetry_kafka_compression || 'none',
    filename: process.env.telemetry_file_filename || 'telemetry-%DATE%.log',
    maxsize: process.env.telemetry_file_maxsize || 10485760,
    maxFiles: process.env.telemetry_file_maxfiles || '100',
    "kafka": {    // The default Kafka configuration includes essential parameters such as broker IP addresses and other configuration options.
      "config": {
        "brokers": [`${process.env.kafka_host || 'localhost'}:${process.env.kafka_port || 9092}`],
        "clientId": process.env.client_id || "obsrv-apis",
        "retry": {
          "initialRetryTime": process.env.kafka_initial_retry_time ? parseInt(process.env.kafka_initial_retry_time) : 3000,
          "retries": process.env.kafka_retries ? parseInt(process.env.kafka_retries) : 1
        },
        "connectionTimeout": process.env.kafka_connection_timeout ? parseInt(process.env.kafka_connection_timeout) : 5000
      },
      "topics": {  // Default Kafka topics depend on type of dataset.
        "createDataset": `${process.env.system_env || 'local'}.ingest`,
        "createMasterDataset": `${process.env.system_env || 'local'}.masterdata.ingest`
      }
    }
  },
  "dataset_types": {
    normalDataset: "dataset",
    masterDataset: "master-dataset"
  },
  "redis_config": {
    "redis_host": process.env.redis_host || 'localhost',
    "redis_port": process.env.redis_port || 6379
  },
  "exclude_datasource_validation": process.env.exclude_datasource_validation ? process.env.exclude_datasource_validation.split(",") : ["system-stats", "failed-events-summary", "masterdata-system-stats", "system-events"], // list of datasource names to skip validation while calling query API
  "telemetry_dataset": process.env.telemetry_dataset || `${env}.system.telemetry.events`,
  "table_names": {     // Names of all tables available for CRUD operations
    "datasets": "datasets",
    "datasources": "datasources",
    "datasetSourceConfig": "dataset_source_config"
  },
  "table_config": {   // This object defines the configuration for each table.
    "datasets": {
      "primary_key": "id",
      "references": []
    },
    "datasources": {
      "primary_key": "id",
      "references": []
    },
    "dataset_source_config": {
      "primary_key": "id",
      "references": []
    }
  },
  "exhaust_config": {
    "cloud_storage_provider": process.env.cloud_storage_provider || "aws", // Supported providers - AWS, GCP, Azure
    "cloud_storage_region": process.env.cloud_storage_region || "", // Region for the cloud provider storage
    "cloud_storage_config": process.env.cloud_storage_config ? JSON.parse(process.env.cloud_storage_config) : {}, // Respective credentials object for cloud provider. Optional if service account provided
    "container": process.env.container || "", // Storage container/bucket name
    "container_prefix": process.env.container_prefix || "", // Path to the folder inside container/bucket. Empty if data at root level
    "storage_url_expiry": process.env.storage_url_expiry ? parseInt(process.env.storage_url_expiry) : 3600, // in seconds, Default 1hr of expiry for Signed URLs.
    "maxQueryDateRange": process.env.exhaust_query_range ? parseInt(process.env.exhaust_query_range) : 31, // in days. Defines the maximum no. of days the files can be fetched
    "exclude_exhaust_types": process.env.exclude_exhaust_types ? process.env.exclude_exhaust_types.split(",") : ["system-stats", "masterdata-system-stats", "system-events",] // list of folder type names to skip exhaust service
  },
}
