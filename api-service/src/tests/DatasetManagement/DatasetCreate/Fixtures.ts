import httpStatus from "http-status"

export const TestInputsForDatasetCreate = {
    VALID_DATASET: {
        "dataset_id": "sb-ddd",
        "type": "dataset",
        "name": "sb-telemetry2",
        "validation_config": {
            "validate": true,
            "mode": "Strict"
        },
        "dedup_config": {
            "drop_duplicates": true,
            "dedup_key": "mid"
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
        "denorm_config": {
            "denorm_fields": [
                {
                    "denorm_key": "actor.id",
                    "denorm_out_field": "userdata"
                }
            ]
        },
        "dataset_config": {
            "data_key": "",
            "timestamp_key": "ets"
        },
        "tags": []
    },

    VALID_MINIMAL_DATASET: {
        "dataset_id": "sb-ddd",
        "type": "dataset",
        "name": "sb-telemetry2",
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
        }
    },

    VALID_MINIMAL_MASTER_DATASET: {
        "dataset_id": "sb-ddd",
        "type": "master-dataset",
        "name": "sb-telemetry2",
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
        }
    },
    VALID_MORE_THAN_MINIMAL_DATASET: {
        "dataset_id": "sb-ddd",
        "type": "dataset",
        "name": "sb-telemetry2",
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
        }, "denorm_config": {
            "denorm_fields": [
                {
                    "denorm_key": "actor.id",
                    "denorm_out_field": "userdata"
                }
            ]
        },
        "dataset_config": {
            "data_key": "",
            "timestamp_key": "ets"
        },
    },
    VALID_MORE_THAN_MINIMAL_MASTER_DATASET: {
        "dataset_id": "sb-ddd",
        "type": "master-dataset",
        "name": "sb-telemetry2",
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
        }, "denorm_config": {
            "denorm_fields": [
                {
                    "denorm_key": "actor.id",
                    "denorm_out_field": "userdata"
                }
            ]
        },
        "dataset_config": {
            "data_key": "",
            "timestamp_key": "ets"
        },
    },
    VALID_MASTER_DATASET: {
        "id": "sb-telemetry2",
        "dataset_id": "sb-ddd",
        "type": "master-dataset",
        "name": "sb-telemetry2",
        "validation_config": {
            "validate": true,
            "mode": "Strict"
        },
        "dedup_config": {
            "drop_duplicates": true,
            "dedup_key": "mid"
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
        "denorm_config": {
            "denorm_fields": [
                {
                    "denorm_key": "actor.id",
                    "denorm_out_field": "userdata"
                }
            ]
        },
        "dataset_config": {
            "data_key": "",
            "timestamp_key": "ets"
        },
        "tags": []
    }
    ,
    SCHEMA_VALIDATION_ERROR_DATASET: {
        "dataset_id": 7
    },

    DATASET_WITH_DUPLICATE_DENORM_KEY: {
        "id": "sb-telemetry2",
        "dataset_id": "sb-ddd",
        "type": "dataset",
        "name": "sb-telemetry2",
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
        "denorm_config": {
            "denorm_fields": [
                {
                    "denorm_key": "actor.id",
                    "denorm_out_field": "userdata"
                },
                {
                    "denorm_key": "actor.id",
                    "denorm_out_field": "userdata"
                }
            ]
        }
    }
}

export const DATASET_CREATE_SUCCESS_FIXTURES = [
    {
        "title": "Dataset creation success: When all the request payload configs provided",
        "requestPayload": TestInputsForDatasetCreate.VALID_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS"
    },
    {
        "title": "Master Dataset creation success: When all the request payload configs provided",
        "requestPayload": TestInputsForDatasetCreate.VALID_MASTER_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS"
    },
    {
        "title": "Dataset creation success: When minimal request payload configs provided",
        "requestPayload": TestInputsForDatasetCreate.VALID_MINIMAL_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS"
    },
    {
        "title": "Master Dataset creation success: When minimal request paylod configs provided",
        "requestPayload": TestInputsForDatasetCreate.VALID_MINIMAL_MASTER_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS"
    },
    {
        "title": "Dataset creation success: When more than minimal request payload configs provided",
        "requestPayload": TestInputsForDatasetCreate.VALID_MORE_THAN_MINIMAL_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS"
    },
    {
        "title": "Master Dataset creation success: When more than minimal request payload configs provided",
        "requestPayload": TestInputsForDatasetCreate.VALID_MORE_THAN_MINIMAL_MASTER_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS"
    },
    {
        "title": "Dataset creation success: When id is not present in request payload and is generated using dataset_id",
        "requestPayload": TestInputsForDatasetCreate.VALID_MORE_THAN_MINIMAL_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS"
    },
]

export const DATASET_FAILURE_DUPLICATE_DENORM_FIXTURES = [
    {
        "title": "Dataset creation failure: Dataset contains duplicate denorm out field",
        "requestPayload": TestInputsForDatasetCreate.DATASET_WITH_DUPLICATE_DENORM_KEY,
        "httpStatus": httpStatus.BAD_REQUEST,
        "status": "FAILED"
    },
    {
        "title": "Master Dataset creation failure: Dataset contains duplicate denorm out field",
        "requestPayload": { ...TestInputsForDatasetCreate.DATASET_WITH_DUPLICATE_DENORM_KEY, type: "master-dataset" },
        "httpStatus": httpStatus.BAD_REQUEST,
        "status": "FAILED"
    }
]