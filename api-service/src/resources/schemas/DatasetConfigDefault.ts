import { config } from "../../configs/Config";

export const defaultConfig = {
    "master": {
        "validation_config": {
            "validate": true,
            "mode": "Strict"
        },
        "extraction_config": {
            "is_batch_event": false,
            "extraction_key": "",
            "dedup_config": {
                "drop_duplicates": true,
                "dedup_key": "id",
                "dedup_period": 3
            }
        },
        "dedup_config": {
            "drop_duplicates": true,
            "dedup_key": "id",
            "dedup_period": 3
        },
        "router_config": {
            "topic": ""
        },
        "tags": [],
        "status": "ACTIVE",
        "created_by": "SYSTEM",
        "updated_by": "SYSTEM"
    },
    "dataset": {
        "validation_config": {
            "validate": true,
            "mode": "Strict"
        },
        "extraction_config": {
            "is_batch_event": false,
            "extraction_key": "",
            "dedup_config": {
                "drop_duplicates": true,
                "dedup_key": "id",
                "dedup_period": 1036800
            }
        },
        "dedup_config": {
            "drop_duplicates": true,
            "dedup_key": "id",
            "dedup_period": 1036800
        },
        "router_config": {
            "topic": ""
        },
        "tags": [],
        "status": "ACTIVE",
        "created_by": "SYSTEM",
        "updated_by": "SYSTEM"
    },
    "sourceConfig": {
        "connector_type": '',
        "connector_config": {},
        "status": 'ACTIVE',
        "connector_stats": {},
        "created_by": 'SYSTEM',
        "updated_by": 'SYSTEM'
    }
}