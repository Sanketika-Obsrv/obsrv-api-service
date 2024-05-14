export const TestInputsForSampleUploadURL = {
    VALID_REQUEST_SCHEMA_WITH_ONE_FILE: {
        "id": "api.datasets.upload-url",
        "ver": "v1",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "files": ["telemetry.json"]
        }
    },
    VALID_REQUEST_SCHEMA_WITH_MORE_THAN_ONE_FILE: {
        "id": "api.datasets.upload-url",
        "ver": "v1",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "files": ["telemetry.json", "school-data.json"]
        }
    },
    REQUEST_SCHEMA_NO_FILES_PROVIDED: {
        "id": "api.datasets.upload-url",
        "ver": "v1",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "files": []
        }
    },
    INVALID_REQUEST_SCHEMA: {
        "id": "api.datasets.upload-url",
        "ver": "v1",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "files": {}
        }
    },
}