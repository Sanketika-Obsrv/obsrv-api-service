// These configurations provide settings and values for various aspects of dataset management, data ingestion, and table configurations in a system.

const env = process.env.system_env || "obsrv"

const getCloudConfigs = () => {
  const cloudConfig = process.env.cloud_storage_config;
  const cloudProvider = process.env.cloud_storage_provider || "aws";
  if (cloudConfig) {
    const parsedCloudConfig = JSON.parse(cloudConfig);
    if (cloudProvider === "aws") {
      const updatedCloudConfig = { ...parsedCloudConfig, "webIdentityTokenFile": process.env.AWS_WEB_IDENTITY_TOKEN_FILE, "roleArn": process.env.AWS_ROLE_ARN };
      return updatedCloudConfig;
    }
    return parsedCloudConfig;
  }
  return {};
} 


export const config = {
  "env": env,
  "api_port": process.env.api_port || 3000,
  "body_parser_limit": process.env.body_parser_limit || "100mb",
  "version": process.env.obsrv_version || "1.6.0",
  "query_api": {
    "druid": {
      "host": process.env.druid_host || "http://localhost",
      "port": process.env.druid_port || 8888,
      "sql_query_path": "/druid/v2/sql/",
      "native_query_path": "/druid/v2",
      "list_datasources_path": "/druid/v2/datasources",
      "submit_ingestion": "druid/indexer/v1/supervisor"
    },
    "prometheus": {
      "url": process.env.prometheus_url || "http://localhost:9090"
    }
  },
  "telemetry_service_config": {
    level: process.env.telemetry_log_level || "info",
    localStorageEnabled: process.env.telemetry_local_storage_enabled || "true",
    dispatcher: process.env.telemetry_local_storage_type || "kafka",
    telemetryProxyEnabled: process.env.telemetry_proxy_enabled,
    proxyURL: process.env.telemetry_proxy_url,
    proxyAuthKey: process.env.telemetry_proxy_auth_key,
    compression_type: process.env.telemetry_kafka_compression || "none",
    filename: process.env.telemetry_file_filename || "telemetry-%DATE%.log",
    maxsize: process.env.telemetry_file_maxsize || 10485760,
    maxFiles: process.env.telemetry_file_maxfiles || "100",
    "kafka": {    // The default Kafka configuration includes essential parameters such as broker IP addresses and other configuration options.
      "config": {
        "brokers": [`${process.env.kafka_host || "localhost"}:${process.env.kafka_port || 9092}`],
        "clientId": process.env.client_id || "obsrv-apis",
        "retry": {
          "initialRetryTime": process.env.kafka_initial_retry_time ? parseInt(process.env.kafka_initial_retry_time) : 3000,
          "retries": process.env.kafka_retries ? parseInt(process.env.kafka_retries) : 1
        },
        "connectionTimeout": process.env.kafka_connection_timeout ? parseInt(process.env.kafka_connection_timeout) : 5000
      },
      "topics": {  // Default Kafka topics depend on type of dataset.
        "createDataset": `ingest`,
        "createMasterDataset": `masterdata.ingest`
      }
    }
  },
  "dataset_types": {
    normalDataset: "dataset",
    masterDataset: "master-dataset"
  },
  "redis_config": {
    "denorm_redis_host": process.env.denorm_redis_host || "localhost",
    "denorm_redis_port": parseInt(process.env.denorm_redis_port as string) || 6379,
    "dedup_redis_host": process.env.dedup_redis_host || "localhost",
    "dedup_redis_port": parseInt(process.env.dedup_redis_port as string) || 6379
  },
  "exclude_datasource_validation": process.env.exclude_datasource_validation ? process.env.exclude_datasource_validation.split(",") : ["system-stats", "failed-events-summary", "masterdata-system-stats", "system-events"], // list of datasource names to skip validation while calling query API
  "telemetry_dataset": process.env.telemetry_dataset || `${env}.system.telemetry.events`,
  "rollup_ratio": parseInt(process.env.rollup_ratio || "80"),
  "unique_formats": ["uuid", "email", "uri", "ipv4", "ipv6"],
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
  "cloud_config": {
    "cloud_storage_provider": process.env.cloud_storage_provider || "aws", // Supported providers - AWS, GCP, Azure
    "cloud_storage_region": process.env.cloud_storage_region || "", // Region for the cloud provider storage
    "cloud_storage_config": process.env.cloud_storage_config ? getCloudConfigs() : {}, // Respective credentials object for cloud provider. Optional if service account provided
    "container": process.env.container || "container", // Storage container/bucket name
    "container_prefix": process.env.container_prefix || "", // Path to the folder inside container/bucket. Empty if data at root level
    "storage_url_expiry": process.env.storage_url_expiry ? parseInt(process.env.storage_url_expiry) : 3600, // in seconds, Default 1hr of expiry for Signed URLs.
    "maxQueryDateRange": process.env.exhaust_query_range ? parseInt(process.env.exhaust_query_range) : 31, // in days. Defines the maximum no. of days the files can be fetched
    "exclude_exhaust_types": process.env.exclude_exhaust_types ? process.env.exclude_exhaust_types.split(",") : ["system-stats", "masterdata-system-stats", "system-events",], // list of folder type names to skip exhaust service
    "telemetry_data_path": process.env.telemetry_data_path || "telemetry-data",
  },
  "template_config": {
    "template_required_variables": process.env.template_required_vars ? process.env.template_required_vars.split(",") : ["DATASET", "STARTDATE", "ENDDATE"],
    "template_additional_variables": process.env.template_additional_vars ? process.env.template_additional_vars.split(",") : ["LIMIT"]
  },
  "presigned_url_configs": {
    "maxFiles": process.env.presigned_urls_max_files_allowed ? parseInt(process.env.presigned_urls_max_files_allowed) : 20,
    "read_storage_url_expiry": process.env.read_storage_url_expiry ? parseInt(process.env.read_storage_url_expiry) : 600,
    "write_storage_url_expiry": process.env.write_storage_url_expiry ? parseInt(process.env.write_storage_url_expiry) : 600,
    "service": process.env.service || "api-service"
  },
  "command_service_config": {
    "host": process.env.command_service_host || "http://localhost",
    "port": parseInt(process.env.command_service_port || "8000"),
    "paths": JSON.parse(process.env.command_service_paths || '{"dataset":"/system/v1/dataset/command","connector":"/connector/v1/register","analyzePII":"/system/data/v1/analyze/pii"}')
  },
  "flink_job_configs": {
    "pipeline_merged_job_manager_url": process.env.pipeline_merged_job_manager_url || "http://localhost:8081",
    "masterdata_processor_job_manager_url": process.env.masterdata_processor_job_manager_url || "http://localhost:8081"
  },
  "encryption_config": {
    "encryption_key": process.env.encryption_key || "strong_encryption_key_to_encrypt",
    "encryption_algorithm": process.env.encryption_algorithm || "aes-256-ecb",
  },
  "grafana_config": {
    "dialect": process.env.dialet || "postgres",
    "url": process.env.grafana_url || "http://localhost:8000",
    "access_token": process.env.grafana_token || ""
  },
  "user_token_public_key": process.env.user_token_public_key || "",
  "is_RBAC_enabled": process.env.is_rbac_enabled || "true",
  "telemetry_log": process.env.telemetry_log || '{"enable":true,"response_data":false}',
  "otel": {
    "enable": process.env.otel_enable || "false",
    "collector_endpoint": process.env.otel_collector_endpoint || "http://localhost:4318"
  },
  "storage_types": process.env.storage_types || '{"lake_house":true,"realtime_store":true}',
  "data_observability": {
    "default_freshness_threshold": process.env.default_freshness_threshold ? parseInt(process.env.default_freshness_threshold) : 5, // in minutes
    "data_out_query_time_period": process.env.data_out_query_time_period || "1d",
    "default_query_time_period": process.env.default_query_time_period ? parseInt(process.env.default_query_time_period) : 7, // in days
  },
  "alerts_rules": {
    "config_path": process.env.alerts_config_path
  },
  "dataset_filter_config": {
    "status_filter_limit": process.env.status_filter_limit ? parseInt(process.env.status_filter_limit) : 10 // Maximum number of filters allowed in a dataset
  } 
}
