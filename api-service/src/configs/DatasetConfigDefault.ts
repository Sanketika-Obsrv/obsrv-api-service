import { config } from "./Config";
import { DatasetStatus, ValidationMode } from "../types/DatasetModels";

export const defaultMasterConfig = {
    "validation_config": {
        "validate": true,
        "mode": ValidationMode.Strict,
    },
    "extraction_config": {
        "is_batch_event": false,
        "extraction_key": "",
        "dedup_config": {
            "drop_duplicates": true,
            "dedup_key": "id",
            "dedup_period": 604800, // 7 days
        }
    },
    "dedup_config": {
        "drop_duplicates": true,
        "dedup_key": "id",
        "dedup_period": 604800, // 7 days
    },
    "denorm_config": {
        "redis_db_host": config.redis_config.redis_host,
        "redis_db_port": config.redis_config.redis_port,
        "denorm_fields": []
    },
    "router_config": {
        "topic": ""
    },
    "tags": [],
    "dataset_config": {
        "data_key": "",
        "timestamp_key": "",
        "entry_topic": config.telemetry_service_config.kafka.topics.createMasterDataset,
        "redis_db_host": config.redis_config.redis_host,
        "redis_db_port": config.redis_config.redis_port,
        "index_data": true,
        "redis_db": 3,
        "file_upload_path": []
    },
    "status": DatasetStatus.Draft,
    "version": 1,
    "created_by": "SYSTEM",
    "updated_by": "SYSTEM"
}

export const defaultDatasetConfig = {
    "validation_config": {
        "validate": true,
        "mode": ValidationMode.Strict,
    },
    "extraction_config": {
        "is_batch_event": false,
        "extraction_key": "",
        "dedup_config": {
            "drop_duplicates": true,
            "dedup_key": "id",
            "dedup_period": 604800, // 7 days
        }
    },
    "dedup_config": {
        "drop_duplicates": true,
        "dedup_key": "id",
        "dedup_period": 604800, // 7 days
    },
    "denorm_config": {
        "redis_db_host": config.redis_config.redis_host,
        "redis_db_port": config.redis_config.redis_port,
        "denorm_fields": []
    },
    "router_config": {
        "topic": ""
    },
    "tags": [],
    "dataset_config": {
        "data_key": "",
        "timestamp_key": "",
        "entry_topic": config.telemetry_service_config.kafka.topics.createDataset,
        "redis_db_host": config.redis_config.redis_host,
        "redis_db_port": config.redis_config.redis_port,
        "index_data": true,
        "redis_db": 0,
        "file_upload_path": []
    },
    "status": DatasetStatus.Draft,
    "version": 1,
    "created_by": "SYSTEM",
    "updated_by": "SYSTEM"
}

export const validDatasetFields = ['dataset_id', 'id', 'name', 'type', 'validation_config', 'extraction_config', 'dedup_config', 'data_schema', 'router_config', 'denorm_config', 'transformations_config', 'dataset_config', 'tags', 'status', 'version', 'created_by', 'updated_by', 'created_date', 'updated_date', 'published_date', "version_key"]