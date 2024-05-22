export const TestInputsForDatasetList = {
    VALID_DRAFT_DATASET_SCHEMA: {
        "dataset_id": "telemetry",
        "id": "telemetry.1",
        "name": "telemetry",
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
            "dedup_key": "msgid",
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
        "created_date": "2024-04-15 07:51:49.49",
        "update_date": "",
        "published_date": ""
    },
    VALID_LIVE_DATASET_SCHEMA: {
        "dataset_id": "sb-telemetry",
        "id": "sb-telemetry",
        "name": "sb-telemetry",
        "type": "master-dataset",
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
            "dedup_key": "msgid",
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
        "created_date": "2024-04-16 07:51:49.49",
        "update_date": "",
        "published_date": ""
    },
    TRANSFORMATIONS_DRAFT_SCHEMA: {
        "dataset_id": "telemetry.1",
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
    },
    TRANSFORMATIONS_LIVE_SCHEMA: {
        "dataset_id": "sb-telemetry",
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
        }
    },

    REQUEST_WITHOUT_FILTERS: {
        "id": "api.datasets.list",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {}
    },
    REQUEST_WITH_STATUS_FILTERS: {
        "id": "api.datasets.list",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "filters": { status: ["Draft"] }
        }
    },
    REQUEST_WITH_TYPE_FILTERS: {
        "id": "api.datasets.list",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "filters": { status: "Live", type: "master-dataset" }
        }
    },
    REQUEST_WITH_SORTBY: {
        "id": "api.datasets.list",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "sortBy": [{ "field": "created_date", "order": "asc" }]
        }
    },
    INVALID_REQUEST: {
        "id": "api.datasets.list",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "filters": { status: ["Ready"] }
        }
    }
}