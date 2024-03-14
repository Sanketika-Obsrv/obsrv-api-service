import { config } from "./Config";
import { DatasetStatus, ValidationMode } from "../types/DatasetModels";

export const defaultConfig = {
    "master": {
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
            "exclude_fields": [],
            "entry_topic": "",
            "redis_db_host": config.redis_config.redis_host,
            "redis_db_port": config.redis_config.redis_port,
            "index_data": true,
            "redis_db": 0  // The default Redis database index.
        },
        "status": "Draft",
        "version": 1,
        "created_by": "SYSTEM",
        "updated_by": "SYSTEM"
    },
    "dataset": {
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
            "exclude_fields": [],
            "entry_topic": "",
            "redis_db_host": config.redis_config.redis_host,
            "redis_db_port": config.redis_config.redis_port,
            "index_data": true,
            "redis_db": 0   // The default Redis database index.
        },
        "status": DatasetStatus.Draft,
        "version": 1,
        "created_by": "SYSTEM",
        "updated_by": "SYSTEM"
    }
}
