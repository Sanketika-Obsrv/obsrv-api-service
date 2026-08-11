export const TestInputsForDatasetList = {
    VALID_DRAFT_DATASET_SCHEMA: {
        "dataset_id": "telemetry",
        "name": "telemetry",
        "type": "events",
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
        },
        "tags": [
            "tag1",
            "tag2"
        ],
        "status": "Draft",
        "version": 1,
        "api_version": "v2"
    },
    VALID_LIVE_DATASET_SCHEMA: {
        "dataset_id": "sb-telemetry",
        "name": "sb-telemetry",
        "type": "master",
        "dataset_config": {
            "indexing_config": {
                "olap_store_enabled": false,
                "lakehouse_enabled": true,
                "cache_enabled": true
            },
            "keys_config": {
                "data_key": "ets"
            },
            "file_upload_path": [
                "telemetry.json"
            ]
        },
        "tags": [
            "tag1",
            "tag2"
        ],
        "status": "Live",
        "data_version": 1,
        "api_version": "v2"
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
            "filters": { status: "Live", type: "master" }
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
    },
    VALID_RESPONSE: [{"dataset_id":"sb-telemetry","name":"sb-telemetry","type":"master","dataset_config":{"indexing_config":{"olap_store_enabled":false,"lakehouse_enabled":true,"cache_enabled":true},"keys_config":{"data_key":"ets"},"file_upload_path":["telemetry.json"]},"tags":["tag1","tag2"],"status":"Live","data_version":1,"api_version":"v2","health":"Healthy","unhealthy_components":[],"metrics":{"total_events":0,"events_today":0,"events_yesterday":0,"failed_today":0,"storage_size_bytes":0}},{"dataset_id":"telemetry","name":"telemetry","type":"events","dataset_config":{"indexing_config":{"olap_store_enabled":false,"lakehouse_enabled":true,"cache_enabled":false},"keys_config":{"timestamp_key":"ets"},"file_upload_path":["telemetry.json"]},"tags":["tag1","tag2"],"status":"Draft","version":1,"api_version":"v2"}]
}