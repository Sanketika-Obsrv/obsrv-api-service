import { config } from "./Config";
import { DatasetStatus, ValidationMode } from "../types/DatasetModels";
import { ingestionConfig } from "./IngestionConfig";

export const defaultDatasetConfig = {
    "validation_config": {
        "validate": true,
        "mode": ValidationMode.Strict,
    },
    "extraction_config": {
        "is_batch_event": true,
        "extraction_key": "events",
        "dedup_config": {
            "drop_duplicates": true,
            "dedup_key": "id",
            "dedup_period": 604800, // 7 days
        }
    },
    "dedup_config": {
        "drop_duplicates": false,
        "dedup_key": "id",
        "dedup_period": 604800, // 7 days
    },
    "denorm_config": {
        "redis_db_host": config.redis_config.denorm_redis_host,
        "redis_db_port": config.redis_config.denorm_redis_port,
        "denorm_fields": []
    },
    "router_config": {
        "topic": ""
    },
    "tags": [],
    "dataset_config": {
        "indexing_config": {
            "olap_store_enabled": true,
            "lakehouse_enabled": true,
            "cache_enabled": false
        },
        "keys_config": {
            "data_key": "",
            "partition_key": "",
            "timestamp_key": ingestionConfig.indexCol["Event Arrival Time"]
        },
        "cache_config": {
            "redis_db_host": config.redis_config.denorm_redis_host,
            "redis_db_port": config.redis_config.denorm_redis_port,
            "redis_db": 0
        },
        "file_upload_path": []
    },
    "entry_topic": config.telemetry_service_config.kafka.topics.createDataset,
    "status": DatasetStatus.Draft,
    "api_version": "v2",
    "sample_data":{},
    "version": 1,
    "created_by": "SYSTEM",
    "updated_by": "SYSTEM"
}

export const validDatasetFields = ["dataset_id", "id", "name", "type", "validation_config", "extraction_config", "dedup_config", "data_schema", "router_config", "denorm_config", "transformations_config", "dataset_config", "tags", "status", "version", "created_by", "updated_by", "created_date", "updated_date", "published_date", "version_key"]