export const TestInputsForSampleUploadURL = {
    VALID_REQUEST_SCHEMA_WITH_ONE_FILE: {
        "id": "api.datasets.upload-url",
        "ver": "v1",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "files": ["telemetry.json"],
            "access": "write"
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
            "files": ["telemetry.json", "school-data.json"],
            "access": "read"
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

    REQUEST_SCHEMA_WITH_EXCEEDED_FILES: {
        "id": "api.datasets.upload-url",
        "ver": "v1",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "files": ["a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json", "a.json"],
            "access": "write"
        }
    },

    VALID_RESPONSE_FOR_MULTIFILES: [
        {
            "filePath": "//telemetry.json",
            "fileName": 'telemetry.json',
            "preSignedUrl": 'https://obsrv-data.s3.ap-south-1.amazonaws.com///telemetry.json?X-Amz-Algorithm=AWS4-HMAC'
        },
        {
            "filePath": '//school-data.json',
            "fileName": 'school-data.json',
            "preSignedUrl": 'https://obsrv-data.s3.ap-south-1.amazonaws.com///school-data.json?X-Amz-Algorithm=AWS4-HMAC'
        }
    ],

    VALID_RESPONSE_FOR_SINGLE_FILE: [
        {
            "filePath": '//telemetry.json',
            "fileName": 'telemetry.json',
            "preSignedUrl": 'https://obsrv-data.s3.ap-south-1.amazonaws.com///telemetry.json?X-Amz-Algorithm=AWS4-HMAC'
        }
    ]
}