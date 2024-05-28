import httpStatus from "http-status"
import _ from "lodash"

export const TestInputsForDatasetCreate = {
    VALID_DATASET: {
        "id": "api.datasets.create",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "dataset_id": "sb-ddd",
            "type": "dataset",
            "name": "sb-telemetry2",
            "validation_config": {
                "validate": true,
                "mode": "Strict"
            },
            "dedup_config": {
                "drop_duplicates": true,
                "dedup_key": "msgid"
            },
            "data_schema": {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                "type": "object",
                "properties": {
                    "eid": {
                        "type": "string"
                    },
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
                "timestamp_key": "ets",
                "file_upload_path": ["/config/file.json"]
            },
            "tags": []
        }
    },

    VALID_DATASET_WITH_DEFAULT_TS: {
        "id": "api.datasets.create",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
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
            "dataset_config": {
                "data_key": "",
                "timestamp_key": "obsrv_meta.syncts"
            },
            "tags": []
        }
    },

    VALID_DATASET_WITH_TRANSFORMATIONS: {
        "id": "api.datasets.create",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
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
            "dataset_config": {
                "data_key": "",
                "timestamp_key": "ets",
                "file_upload_path": ["/config/file.json"]
            },
            "transformations_config": [
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
            "tags": []
        }
    },

    VALID_DATASET_WITH_MULTIPLE_TRANSFORMATIONS: {
        "id": "api.datasets.create",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
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
                    "ets": {
                        "type": "string"
                    },
                    "required": [
                        "eid"
                    ]
                },
                "additionalProperties": true
            },
            "dataset_config": {
                "data_key": "",
                "timestamp_key": "ets",
                "file_upload_path": ["/config/file.json"]
            },
            "transformations_config": [
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
                },
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
            "tags": []
        }
    },

    VALID_MINIMAL_DATASET: {
        "id": "api.datasets.create",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
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
                    "ets": {
                        "type": "string"
                    },
                    "required": [
                        "eid"
                    ]
                },
                "additionalProperties": true
            },
            "dataset_config": {
                "data_key": "",
                "timestamp_key": "ets"
            }
        }
    },

    VALID_MINIMAL_MASTER_DATASET: {
        "id": "api.datasets.create",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
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
                    "ets": {
                        "type": "string"
                    },
                    "required": [
                        "eid"
                    ]
                },
                "additionalProperties": true
            },
            "dataset_config": {
                "data_key": "",
                "timestamp_key": "ets"
            }
        }
    },
    VALID_MORE_THAN_MINIMAL_DATASET: {
        "id": "api.datasets.create",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
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
                    "ets": {
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
            }
        }
    },
    VALID_MORE_THAN_MINIMAL_MASTER_DATASET: {
        "id": "api.datasets.create",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
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
                    "ets": {
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
        }
    },
    VALID_MASTER_DATASET: {
        "id": "api.datasets.create",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
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
                "dedup_key": "msgid"
            },
            "data_schema": {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                "type": "object",
                "properties": {
                    "eid": {
                        "type": "string"
                    },
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
    }
    ,
    SCHEMA_VALIDATION_ERROR_DATASET: {
        "id": "api.datasets.create",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "dataset_id": 7
        }
    },

    DATASET_WITH_INVALID_TIMESTAMP: {
        "id": "api.datasets.create",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
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
            "dataset_config": {
                "data_key": "",
                "timestamp_key": "lastAccessed"
            },
            "tags": []
        }
    },

    DATASET_WITH_DUPLICATE_DENORM_KEY: {
        "id": "api.datasets.create",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
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
}

export const DATASET_CREATE_SUCCESS_FIXTURES = [
    {
        "title": "Dataset creation success: When all the request payload configs provided",
        "requestPayload": TestInputsForDatasetCreate.VALID_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS",
        "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
    },
    {
        "title": "Master Dataset creation success: When all the request payload configs provided",
        "requestPayload": TestInputsForDatasetCreate.VALID_MASTER_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS",
        "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
    },
    {
        "title": "Dataset creation success: When minimal request payload configs provided",
        "requestPayload": TestInputsForDatasetCreate.VALID_MINIMAL_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS",
        "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
    },
    {
        "title": "Master Dataset creation success: When minimal request paylod configs provided",
        "requestPayload": TestInputsForDatasetCreate.VALID_MINIMAL_MASTER_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS",
        "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
    },
    {
        "title": "Dataset creation success: When more than minimal request payload configs provided",
        "requestPayload": TestInputsForDatasetCreate.VALID_MORE_THAN_MINIMAL_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS",
        "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
    },
    {
        "title": "Master Dataset creation success: When more than minimal request payload configs provided",
        "requestPayload": TestInputsForDatasetCreate.VALID_MORE_THAN_MINIMAL_MASTER_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS",
        "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
    },
    {
        "title": "Dataset creation success: When id is not present in request payload and is generated using dataset_id",
        "requestPayload": TestInputsForDatasetCreate.VALID_MORE_THAN_MINIMAL_DATASET,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS",
        "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
    },
    {
        "title": "Dataset creation success: When transformation payload provided",
        "requestPayload": TestInputsForDatasetCreate.VALID_DATASET_WITH_TRANSFORMATIONS,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS",
        "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
    },
    {
        "title": "Dataset creation success: When multiple transformation payload provided with same field key",
        "requestPayload": TestInputsForDatasetCreate.VALID_DATASET_WITH_MULTIPLE_TRANSFORMATIONS,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS",
        "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
    },
    {
        "title": "Dataset creation success: Geenerating ingestion spec successfully using the data schema",
        "requestPayload": TestInputsForDatasetCreate.VALID_DATASET_WITH_DEFAULT_TS,
        "httpStatus": httpStatus.OK,
        "status": "SUCCESS",
        "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
    },
]

export const DATASET_FAILURE_DUPLICATE_DENORM_FIXTURES = [
    {
        "title": "Dataset creation failure: Dataset contains duplicate denorm out field",
        "requestPayload": TestInputsForDatasetCreate.DATASET_WITH_DUPLICATE_DENORM_KEY,
        "httpStatus": httpStatus.BAD_REQUEST,
        "status": "FAILED",
        "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
    },
    {
        "title": "Master Dataset creation failure: Dataset contains duplicate denorm out field",
        "requestPayload": _.set(TestInputsForDatasetCreate.DATASET_WITH_DUPLICATE_DENORM_KEY, "request.type", "master-dataset"),
        "httpStatus": httpStatus.BAD_REQUEST,
        "status": "FAILED",
        "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
    }
]