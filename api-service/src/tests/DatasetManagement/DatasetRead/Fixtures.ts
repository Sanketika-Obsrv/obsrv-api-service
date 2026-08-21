export const TestInputsForDatasetRead = {
    DRAFT_SCHEMA: {
        "dataset_id": "sb-telemetry",
        "name": "sb-telemetry",
        "type": "event",
        "status": "Draft",
        "tags": [
            "tag1",
            "tag2"
        ],
        "version": 1,
        "api_version": "v2",
        "dataset_config": {
            "indexing_config": {
                "olap_store_enabled": false,
                "lakehouse_enabled": true,
                "cache_enabled": false
            },
            "keys_config": {
                "timestamp_key": "ets"
            },
            "file_upload_path": [
                "telemetry.json"
            ]
        }
    },
    DRAFT_SCHEMA_V1: {
        "dataset_id": "sb-telemetry",
        "name": "sb-telemetry",
        "type": "event",
        "status": "Draft",
        "tags": [
            "tag1",
            "tag2"
        ],
        "validation_config": {
            "validate": true,
            "validation_mode": "Strict",
            "mode": "Strict"
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
                "ets": {
                    "type": "string"
                },
                "required": [
                    "eid"
                ]
            },
            "additionalProperties": true
        },
        "version": 1,
        "api_version": "v1",
        "dataset_config": {
            "timestamp_key": "ets",
            "data_key": "",
            "redis_db_host": "localhost",
            "redis_db_port": 6379,
            "redis_db": 0
        }
    },
    LIVE_SCHEMA: {
        "dataset_id": "sb-telemetry",
        "name": "sb-telemetry",
        "type": "event",
        "status": "Live",
        "tags": [
            "tag1",
            "tag2"
        ],
        "data_version": 1,
        "api_version": "v2",
        "denorm_config": {
            "denorm_fields": [
                {
                    "denorm_key": "actor.id",
                    "denorm_out_field": "userdata",
                    "redis_db": 16
                }
            ]
        },
        "dataset_config": {
            "indexing_config": {
                "olap_store_enabled": false,
                "lakehouse_enabled": true,
                "cache_enabled": false
            },
            "keys_config": {
                "timestamp_key": "ets"
            },
            "file_upload_path": [
                "telemetry.json"
            ]
        }
    },
    MASTER_DATASET_SCHEMA:[{"dataset_id":"master_dataset", "dataset_config":{"cache_config":{"redis_db":16}}}],
    DATASOURCE_SCHEMA: { "datasource": "sb-telemetry-events", "ingestion_spec": { "type": "kafka", "dataSchema": {}, "ioConfig": {}, "tuningConfig": {} } },
    TRANSFORMATIONS_SCHEMA: [{ "field_key": "eid", "transformation_function": { "type": "mask", "expr": "eid", "datatype": "string", "category": "pii" }, "mode": "Strict" }],
    TRANSFORMATIONS_SCHEMA_V1: [
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
    ],
    CONNECTORS_SCHEMA_V1: [
        {
            "id": "hsh882ehdshe",
            "connector_type": "kafka",
            "connector_config": {
                "topic": "local.ingest",
                "brokerURL": "localhost:9092"
            }
        }
    ],
    CONNECTORS_SCHEMA_V2: [
        {
            "id": "hsh882ehdshe",
            "connector_id": "kafka",
            "connector_config": {
                "topic": "local.ingest",
                "brokerURL": "localhost:9092"
            }
        }
    ]
}