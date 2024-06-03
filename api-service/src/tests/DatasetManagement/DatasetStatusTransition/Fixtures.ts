export const TestInputsForDatasetStatusTransition = {
    VALID_SCHEMA_FOR_DELETE: {
        "id": "api.datasets.status-transition",
        "ver": "v2",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6"
        },
        "request": {
            "dataset_id": "telemetry.1",
            "status": "Delete"
        }
    },
    VALID_SCHEMA_FOR_LIVE: {
        "id": "api.datasets.status-transition",
        "ver": "v2",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6"
        },
        "request": {
            "dataset_id": "telemetry.1",
            "status": "Live"
        }
    },
    VALID_SCHEMA_FOR_RETIRE: {
        "id": "api.datasets.status-transition",
        "ver": "v2",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6"
        },
        "request": {
            "dataset_id": "telemetry",
            "status": "Retire"
        }
    },
    INVALID_SCHEMA: {
        "id": "api.datasets.status-transition",
        "ver": "v2",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6"
        },
        "request": {
            "dataset_id": "telemetry.1",
            "status": ""
        }
    },
    VALID_REQUEST_FOR_READY_FOR_PUBLISH:{
        "id": "api.datasets.status-transition",
        "ver": "v2",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6"
        },
        "request": {
            "dataset_id": "telemetry.1",
            "status": "ReadyToPublish"
        }
    },
    VALID_SCHEMA_FOR_READY_TO_PUBLISH: {
        "dataset_id": "telemetry",
        "type": "dataset",
        "name": "sb-telemetry",
        "id": "telemetry.1",
        "status": "Draft",
        "version_key": "1789887878",
        "validation_config": {
          "validate": true,
          "mode": "Strict"
        },
        "extraction_config": {
          "is_batch_event": true,
          "extraction_key": "events",
          "batch_id": "id",
          "dedup_config": {
            "drop_duplicates": true,
            "dedup_key": "id",
            "dedup_period": 3783
          }
        },
        "dedup_config": {
          "drop_duplicates": true,
          "dedup_key": "mid",
          "dedup_period": 3783
        },
        "data_schema": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "ets": {
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
          "topic": "test"
        },
        "denorm_config": {
          "redis_db_host": "local",
          "redis_db_port": 5432,
          "denorm_fields": [
            {
              "denorm_key": "actor.id",
              "denorm_out_field": "userdata",
              "dataset_name": "name",
              "dataset_id": "name"
            },
            {
              "denorm_key": "actor.id",
              "denorm_out_field": "mid",
              "dataset_name": "name",
              "dataset_id": "name"
            }
          ]
        },
        "dataset_config": {
          "data_key": "mid",
          "timestamp_key": "ets",
          "entry_topic": "topic",
          "redis_db_host": "local",
          "redis_db_port": 5432,
          "redis_db": 0,
          "index_data": true
        },
        "client_state": {},
        "tags": [
          "tag1",
          "tag2"
        ]
      },
      INVALID_SCHEMA_FOR_READY_TO_PUBLISH: {
        "dataset_id": "telemetry",
        "type": "",
        "name": "sb-telemetry",
        "id": "telemetry.1",
        "status": "Draft",
        "version_key": "1789887878",
        "validation_config": {
          "validate": true,
          "mode": "Strict"
        },
        "router_config": {
          "topic": "test"
        },
        "denorm_config": {
          "redis_db_host": "local",
          "redis_db_port": 5432,
          "denorm_fields": [
            {
              "denorm_key": "actor.id",
              "denorm_out_field": "userdata",
              "dataset_name": "name",
              "dataset_id": "name"
            },
            {
              "denorm_key": "actor.id",
              "denorm_out_field": "mid",
              "dataset_name": "name",
              "dataset_id": "name"
            }
          ]
        },
        "dataset_config": {
          "data_key": "mid",
          "timestamp_key": "ets",
          "entry_topic": "topic",
          "redis_db_host": "local",
          "redis_db_port": 5432,
          "redis_db": 0,
          "index_data": true
        },
        "client_state": {},
        "tags": [
          "tag1",
          "tag2"
        ]
      }
}