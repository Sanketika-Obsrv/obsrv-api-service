export const TestInputsForDatasetStatus = {
    VALID_SCHEMA_FOR_DELETE: {
        "id": "api.datasets.status",
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
    VALID_SCHEMA_FOR_PUBLISH: {
        "id": "api.datasets.status",
        "ver": "v2",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6"
        },
        "request": {
            "dataset_id": "telemetry.1",
            "status": "Publish"
        }
    },
    VALID_SCHEMA_FOR_RETIRE: {
        "id": "api.datasets.status",
        "ver": "v2",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6"
        },
        "request": {
            "dataset_id": "telemetry.1",
            "status": "Retire"
        }
    },
    INVALID_SCHEMA: {
        "id": "api.datasets.status",
        "ver": "v2",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6"
        },
        "request": {
            "dataset_id": "telemetry.1",
            "status": ""
        }
    }
}