import _ from "lodash"

const fileNames = ["telemetry.json", "f1.json", "file2.json", "file3.json", "file3.json", "file19.json", "file22.json", "f6.json", "f9.json", "f10.json", "f11.json"]

export const TestInputsForGenerateURL = {
    VALID_REQUEST_SCHEMA_WITH_ONE_FILE: {
        "id": "api.files.generate-url",
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
        "id": "api.files.generate-url",
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
    INVALID_REQUEST_SCHEMA: {
        "id": "api.files.generate-url",
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
        "id": "api.files.generate-url",
        "ver": "v1",
        "ts": "2024-04-19T12:58:47+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "files": _.concat(fileNames, fileNames),
            "access": "write"
        }
    },

    VALID_RESPONSE_FOR_MULTIFILES: [
        {
            "filePath": `container/api-service/user-upload/telemetry.json`,
            "fileName": 'telemetry.json',
            "preSignedUrl": 'https://obsrv-data.s3.ap-south-1.amazonaws.com/container/api-service/user-upload/telemetry.json?X-Amz-Algorithm=AWS4-HMAC'
        },
        {
            "filePath": 'container/api-service/user-upload/school-data.json',
            "fileName": 'school-data.json',
            "preSignedUrl": 'https://obsrv-data.s3.ap-south-1.amazonaws.com/container/api-service/user-upload/school-data.json?X-Amz-Algorithm=AWS4-HMAC'
        }
    ],

    VALID_RESPONSE_FOR_SINGLE_FILE: [
        {
            "filePath": 'container/api-service/user-upload/telemetry.json',
            "fileName": 'telemetry.json',
            "preSignedUrl": 'https://obsrv-data.s3.ap-south-1.amazonaws.com/container/api-service/user-upload/telemetry.json?X-Amz-Algorithm=AWS4-HMAC'
        }
    ]
}