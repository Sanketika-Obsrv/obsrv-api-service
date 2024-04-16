export const TestInputsForDatasetRead = {
    DRAFT_SCHEMA: {
        "dataset_id": "sb-telemetry",
        "id": "sb-telemetry.1",
        "name": "sb-telemetry",
        "type": "dataset",
        "validation_config": {
            "validate": true,
            "mode": "Strict"
        },
        "extraction_config": {
            "is_batch_event": true,
            "extraction_key": "events",
            "dedup_config": {
                "drop_duplicates": true,
                "dedup_key": "id",
                "dedup_period": 604800
            }
        },
        "dedup_config": {
            "drop_duplicates": true,
            "dedup_key": "mid",
            "dedup_period": 604800
        },
        "data_schema": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "type": "object",
            "properties": {
                "eid": {
                    "type": "string"
                },
                "ver": {
                    "type": "string"
                },
                "required": [
                    "eid"
                ]
            },
            "additionalProperties": true
        },
        "router_config": {
            "topic": ""
        },
        "denorm_config": {
            "redis_db_host": "localhost",
            "redis_db_port": 6379,
            "denorm_fields": [
                {
                    "denorm_key": "actor.id",
                    "denorm_out_field": "userdata"
                }
            ]
        },
        "dataset_config": {
            "data_key": "eid",
            "timestamp_key": "ets",
            "entry_topic": "local.ingest",
            "redis_db_host": "localhost",
            "redis_db_port": 6379,
            "index_data": true,
            "redis_db": 0
        },
        "tags": [
            "tag1",
            "tag2"
        ],
        "status": "Draft",
        "version": 1,
        "client_state": {},
        "created_by": "SYSTEM",
        "updated_by": "SYSTEM",
        "created_date": "",
        "update_date": "",
        "published_date": ""
    },
    LIVE_SCHEMA: {

        "dataset_id": "sb-telemetry",
        "id": "sb-telemetry.1",
        "name": "sb-telemetry",
        "type": "dataset",
        "validation_config": {
            "validate": true,
            "mode": "Strict"
        },
        "extraction_config": {
            "is_batch_event": true,
            "extraction_key": "events",
            "dedup_config": {
                "drop_duplicates": true,
                "dedup_key": "id",
                "dedup_period": 604800
            }
        },
        "dedup_config": {
            "drop_duplicates": true,
            "dedup_key": "mid",
            "dedup_period": 604800
        },
        "data_schema": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "type": "object",
            "properties": {
                "eid": {
                    "type": "string"
                },
                "ver": {
                    "type": "string"
                },
                "required": [
                    "eid"
                ]
            },
            "additionalProperties": true
        },
        "router_config": {
            "topic": ""
        },
        "denorm_config": {
            "redis_db_host": "localhost",
            "redis_db_port": 6379,
            "denorm_fields": [
                {
                    "denorm_key": "actor.id",
                    "denorm_out_field": "userdata"
                }
            ]
        },
        "dataset_config": {
            "data_key": "eid",
            "timestamp_key": "ets",
            "entry_topic": "local.ingest",
            "redis_db_host": "localhost",
            "redis_db_port": 6379,
            "index_data": true,
            "redis_db": 0
        },
        "tags": [
            "tag1",
            "tag2"
        ],
        "status": "Live",
        "data_version": 1,
        "created_by": "SYSTEM",
        "updated_by": "SYSTEM",
        "created_date": "",
        "update_date": "",
        "published_date": ""
    },
    TRANSFORMATIONS_SCHEMA: [
        {
            "field_key": "eid",
            "transformation_function": {
                "type": "mask",
                "expr": "eid",
                "condition": null
            },
            "mode": "Strict",
            "metadata": {
                "_transformationType": "mask",
                "_transformedFieldDataType": "string",
                "_transformedFieldSchemaType": "string",
                "section": "transformation"
            }
        }
    ]
}