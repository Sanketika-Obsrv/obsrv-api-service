export const TestInputsForDatasetUpdate = {

    MINIMAL_DATASET_UPDATE_REQUEST: {
        "dataset_id": "telemetry",
        "name": "telemetry"
    },

    DATASET_UPDATE_TAG_ADD: {
        "dataset_id": "telemetry",
        "tags": [
            {
                "values": [
                    "tag1",
                    "tag2"
                ],
                "action": "add"
            }]
    },

    DATASET_UPDATE_TAG_REMOVE: {
        "dataset_id": "telemetry",
        "tags": [
            {
                "values": [
                    "tag1",
                    "tag2"
                ],
                "action": "remove"
            }]
    },

    DATASET_UPDATE_DENORM_ADD: {
        "dataset_id": "telemetry",
        "denorm_config": {
            "denorm_fields": [
                {
                    "values": {
                        "denorm_key": "actor.id",
                        "denorm_out_field": "userdata"
                    },
                    "action": "add"
                }
            ]
        }
    },

    DATASET_UPDATE_DENORM_REMOVE: {
        "dataset_id": "telemetry",
        "denorm_config": {
            "denorm_fields": [
                {
                    "values": {
                        "denorm_key": "actor.id",
                        "denorm_out_field": "userdata"
                    },
                    "action": "remove"
                }
            ]
        }
    },

    DATASET_UPDATE_TRANSFORMATIONS_ADD: {
        "dataset_id": "telemetry",
        "transformation_config": [
            {
                "values": {
                    "field_key": "key1",
                    "transformation_function": {},
                    "mode": "Strict",
                    "metadata": {}
                },
                "action": "add"
            }]
    },

    DATASET_UPDATE_DEDUP_DUPLICATES_TRUE: {
        "dataset_id": "telemetry",
        "dedup_config": {
            "drop_duplicates": true,
            "dedup_key": "mid"
        }
    },

    DATASET_UPDATE_EXTRACTION_DROP_DUPLICATES: {
        "dataset_id": "telemetry",
        "extraction_config": {
            "is_batch_event": true,
            "extraction_key": "events",
            "dedup_config": {
                "drop_duplicates": true,
                "dedup_key": "id"
            }
        }
    },

    DATASET_UPDATE_VALIDATION_VALIDATE: {
        "dataset_id": "telemetry",
        "validation_config": {
            "validate": true,
            "mode": "Strict"
        }
    },

    DATASET_UPDATE_DATA_SCHEMA_VALID: {
        "dataset_id": "telemetry",
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

    DATASET_UPDATE_DATASET_CONFIG_VALID: {
        "dataset_id": "telemetry",
        "dataset_config": {
            "data_key": "mid",
            "timestamp_key": "ets"
        }
    },

    DATASET_UPDATE_TRANSFORMATIONS_REMOVE: {
        "dataset_id": "telemetry",
        "transformation_config": [
            {
                "values": {
                    "field_key": "key1",
                    "transformation_function": {},
                    "mode": "Strict",
                    "metadata": {}
                },
                "action": "remove"
            }]
    },

    DATASET_UPDATE_TRANSFORMATIONS_UPDATE: {
        "dataset_id": "telemetry",
        "transformation_config": [
            {
                "values": {
                    "field_key": "key1",
                    "transformation_function": {},
                    "mode": "Strict",
                    "metadata": {}
                },
                "action": "update"
            }]
    },

    DATASET_UPDATE_REQUEST: {
        "dataset_id": "telemetry",
        "name": "sb-telemetry",
        "validation_config": {
            "validate": true,
            "mode": "Strict"
        },
        "extraction_config": {
            "is_batch_event": true,
            "extraction_key": "events",
            "dedup_config": {
                "drop_duplicates": true,
                "dedup_key": "id"
            }
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
                    "values": {
                        "denorm_key": "actor.id",
                        "denorm_out_field": "userdata"
                    },
                    "action": "add"
                },
                {
                    "values": {
                        "denorm_key": "actor.id",
                        "denorm_out_field": "mid"
                    },
                    "action": "remove"
                }
            ]
        },
        "transformation_config": [
            {
                "values": {
                    "field_key": "key1",
                    "transformation_function": {},
                    "mode": "Strict",
                    "metadata": {}
                },
                "action": "add"
            },
            {
                "values": {
                    "field_key": "key2",
                    "transformation_function": {},
                    "mode": "Strict",
                    "metadata": {}
                },
                "action": "remove"
            },
            {
                "values": {
                    "field_key": "key3",
                    "transformation_function": {},
                    "mode": "Strict",
                    "metadata": {}
                },
                "action": "update"
            }
        ],
        "dataset_config": {
            "data_key": "mid",
            "timestamp_key": "ets"
        },
        "tags": [
            {
                "values": [
                    "tag1",
                    "tag2"
                ],
                "action": "remove"
            },
            {
                "values": [
                    "tag3",
                    "tag4"
                ],
                "action": "add"
            }
        ]
    },

    DATASET_UPDATE_DUPLICATE_DENORM_KEY: {
        "dataset_id": "telemetry",
        "denorm_config": {
            "denorm_fields": [
                {
                    "values": {
                        "denorm_key": "actor.id",
                        "denorm_out_field": "userdata"
                    },
                    "action": "add"
                },
                {
                    "values": {
                        "denorm_key": "actor.id",
                        "denorm_out_field": "userdata"
                    },
                    "action": "add"
                }
            ]
        }
    },

    DATASET_UPDATE_WITH_SAME_TAGS_ADD: {
        "dataset_id": "telemetry",
        "name": "sb-telemetry",
        "tags": [
            {
                "values": [
                    "tag1",
                    "tag1"
                ],
                "action": "remove"
            },
            {
                "values": [
                    "tag4",
                    "tag4"
                ],
                "action": "add"
            }
        ]
    },

    DATASET_UPDATE_WITH_SAME_DENORM_REMOVE: {
        "dataset_id": "telemetry",
        "name": "sb-telemetry",
        "denorm_config": {
            "denorm_fields": [
                {
                    "values": {
                        "denorm_key": "actor.id",
                        "denorm_out_field": "mid"
                    },
                    "action": "remove"
                },
                {
                    "values": {
                        "denorm_key": "actor.id",
                        "denorm_out_field": "mid"
                    },
                    "action": "remove"
                }
            ]
        }
    },

    DATASET_UPDATE_WITH_SAME_TRANSFORMATION_ADD_REMOVE: {
        "dataset_id": "telemetry",
        "name": "sb-telemetry",
        "transformation_config": [
            {
                "values": {
                    "field_key": "key1",
                    "transformation_function": {},
                    "mode": "Strict",
                    "metadata": {}
                },
                "action": "add"
            },
            {
                "values": {
                    "field_key": "key1",
                    "transformation_function": {},
                    "mode": "Strict",
                    "metadata": {}
                },
                "action": "add"
            },
            {
                "values": {
                    "field_key": "key2",
                    "transformation_function": {},
                    "mode": "Strict",
                    "metadata": {}
                },
                "action": "remove"
            },
            {
                "values": {
                    "field_key": "key2",
                    "transformation_function": {},
                    "mode": "Strict",
                    "metadata": {}
                },
                "action": "remove"
            },
            {
                "values": {
                    "field_key": "key3",
                    "transformation_function": {},
                    "mode": "Strict",
                    "metadata": {}
                },
                "action": "update"
            },
            {
                "values": {
                    "field_key": "key3",
                    "transformation_function": {},
                    "mode": "Strict",
                    "metadata": {}
                },
                "action": "update"
            }
        ]
    }
}
