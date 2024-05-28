export const requestStructure = {
    "id": "api.datasets.update",
    "ver": "v2",
    "ts": "2024-04-10T16:10:50+05:30",
    "params": {
        "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
    }
}

export const validVersionKey = "1713444815918"

export const TestInputsForDatasetUpdate = {

    MINIMAL_DATASET_UPDATE_REQUEST: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
            "name": "telemetry"
        }
    },

    DATASET_UPDATE_TAG_ADD: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
            "tags": [
                {
                    "values": [
                        "tag1",
                        "tag2"
                    ],
                    "action": "add"
                }]
        }
    },

    DATASET_UPDATE_TAG_REMOVE: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
            "tags": [
                {
                    "values": [
                        "tag1",
                        "tag2"
                    ],
                    "action": "remove"
                }]
        }
    },

    DATASET_UPDATE_DENORM_ADD: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
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
        }
    },

    DATASET_UPDATE_DENORM_REMOVE: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
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
        }
    },

    DATASET_UPDATE_TRANSFORMATIONS_ADD: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
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
        }
    },

    DATASET_UPDATE_DEDUP_DUPLICATES_TRUE: {
        ...requestStructure,
        request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
            "dedup_config": {
                "drop_duplicates": true,
                "dedup_key": "mid"
            }
        }
    },

    DATASET_UPDATE_EXTRACTION_DROP_DUPLICATES: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
            "extraction_config": {
                "is_batch_event": true,
                "extraction_key": "events",
                "dedup_config": {
                    "drop_duplicates": true,
                    "dedup_key": "id"
                }
            }
        }
    },

    DATASET_UPDATE_VALIDATION_VALIDATE: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
            "validation_config": {
                "validate": true,
                "mode": "Strict"
            }
        }
    },

    DATASET_UPDATE_DATA_SCHEMA_VALID: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
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
        }
    },

    DATASET_WITH_INVALID_TIMESTAMP: {
        ...requestStructure,
        request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
            "name": "sb-telemetry",
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
                "data_key": "eid",
                "timestamp_key": "ets",
                "file_upload_path": ["/config/file.json"]
            }
        }
    },

    DATASET_UPDATE_DATASET_CONFIG_VALID: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
            "dataset_config": {
                "data_key": "mid",
                "timestamp_key": "ets"
            }
        }
    },

    DATASET_UPDATE_TRANSFORMATIONS_REMOVE: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
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
        }
    },

    DATASET_UPDATE_TRANSFORMATIONS_UPDATE: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
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
        }
    },

    DATASET_UPDATE_REQUEST: {
        ...requestStructure,
        request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
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
                "timestamp_key": "ets",
                "file_upload_path": ["/config/file.json"]
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
        }
    },

    DATASET_UPDATE_DUPLICATE_DENORM_KEY: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
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
        }
    },

    DATASET_UPDATE_WITH_SAME_TAGS_ADD: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
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
        }
    },

    DATASET_UPDATE_WITH_SAME_DENORM_REMOVE: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
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
        }
    },

    DATASET_UPDATE_WITH_SAME_TRANSFORMATION_ADD_REMOVE: {
        ...requestStructure, request: {
            "dataset_id": "telemetry",
            "version_key": validVersionKey,
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
}

export const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6d"