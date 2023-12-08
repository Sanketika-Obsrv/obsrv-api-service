import { config } from "../../configs/Config";
import { DatasetStatus, ValidationMode } from "../../models/DatasetModels";

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
                "drop_duplicates": false,
                "dedup_key": "",
                "dedup_period": 604800, // 7 days
            }
        },
        "dedup_config": {
            "drop_duplicates": true,
            "dedup_key": "id",
            "dedup_period": 604800, // 7 days
        },
        "router_config": {
            "topic": ""
        },
        "tags": [],
        "status": DatasetStatus.Live,
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
        "router_config": {
            "topic": ""
        },
        "tags": [],
        "status": DatasetStatus.Live,
        "created_by": "SYSTEM",
        "updated_by": "SYSTEM"
    },
    "sourceConfig": {
        "connector_type": '',
        "connector_config": {},
        "status": DatasetStatus.Live,
        "connector_stats": {},
        "created_by": 'SYSTEM',
        "updated_by": 'SYSTEM'
    }
}
