export const TestInputsForConnectorsRead = {
    LIVE_CONNECTORS: {
        "id": "api.connectors.read",
        "ver": "v2",
        "ts": "2024-07-31T18:17:54+05:30",
        "params": {
            "status": "SUCCESS",
            "resmsgid": "7587f564-c2d7-49a8-9e56-dc56f6808ced"
        },
        "responseCode": "OK",
        "result": {
            "id": "postgres-connector-1.0.0",
            "connector_id": "postgres-connector",
            "name": "PostgreSQL",
            "type": "source",
            "category": "Database",
            "version": "1.0.0",
            "description": "The PostgreSQL Connector is used to move data from any Postgres Table to the Obsrv platform",
            "licence": "MIT",
            "owner": "Sunbird",
            "iconurl": "https://upload.wikimedia.org/wikipedia/commons/2/29/Postgresql_elephant.svg",
            "status": "Live",
            "ui_spec": {
                "schema": {
                    "type": "object",
                    "properties": {
                        "connector_config": {
                            "title": "Connector Config",
                            "type": "object",
                            "encrypt": true,
                            "properties": {
                                "databaseType": {
                                    "type": "string",
                                    "title": "Database Type",
                                    "enum": [
                                        "PostgreSQL",
                                        "MySQL"
                                    ],
                                    "fieldDescription": [
                                        {
                                            "type": "string",
                                            "description": ""
                                        }
                                    ]
                                }
                            },
                            "dependencies": {
                                "databaseType": {
                                    "oneOf": [
                                        {
                                            "properties": {
                                                "databaseType": {
                                                    "enum": [
                                                        "PostgreSQL",
                                                        "MySQL"
                                                    ]
                                                },
                                                "connection_info": {
                                                    "title": "Connection Information",
                                                    "type": "object",
                                                    "properties": {
                                                        "host": {
                                                            "type": "string",
                                                            "title": "Database Host",
                                                            "pattern": "/^(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}(?:/[^\\s]*)?|localhost(?:/[^\\s]*)?|((?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/",
                                                            "fieldDescription": [
                                                                {
                                                                    "type": "string",
                                                                    "description": ""
                                                                }
                                                            ]
                                                        },
                                                        "port": {
                                                            "type": "number",
                                                            "title": "Database Port",
                                                            "minimum": 1,
                                                            "maximum": 65535,
                                                            "fieldDescription": [
                                                                {
                                                                    "type": "string",
                                                                    "description": ""
                                                                }
                                                            ]
                                                        },
                                                        "name": {
                                                            "type": "string",
                                                            "title": "Database Name",
                                                            "pattern": "^[a-zA-Z0-9_]{1,64}$",
                                                            "fieldDescription": [
                                                                {
                                                                    "type": "string",
                                                                    "description": ""
                                                                }
                                                            ]
                                                        },
                                                        "username": {
                                                            "type": "string",
                                                            "title": "Database Username",
                                                            "fieldDescription": [
                                                                {
                                                                    "type": "string",
                                                                    "description": ""
                                                                }
                                                            ]
                                                        },
                                                        "password": {
                                                            "type": "string",
                                                            "title": "Database Password",
                                                            "fieldDescription": [
                                                                {
                                                                    "type": "string",
                                                                    "description": ""
                                                                }
                                                            ]
                                                        }
                                                    }
                                                },
                                                "schemaInfo": {
                                                    "title": "Schema Information",
                                                    "type": "object",
                                                    "properties": {
                                                        "table": {
                                                            "title": "Table Name",
                                                            "type": "string",
                                                            "pattern": "^[a-zA-Z_][a-zA-Z0-9_]{0,62}$",
                                                            "fieldDescription": [
                                                                {
                                                                    "type": "string",
                                                                    "description": ""
                                                                }
                                                            ]
                                                        },
                                                        "timestampColumn": {
                                                            "title": "Timestamp Column",
                                                            "type": "string",
                                                            "fieldDescription": [
                                                                {
                                                                    "type": "string",
                                                                    "description": ""
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        },
                        "operations_config": {
                            "title": "Operations Configuration",
                            "type": "object",
                            "properties": {
                                "batch_size": {
                                    "type": "number",
                                    "title": "Batch Size",
                                    "default": 100,
                                    "fieldDescription": [
                                        {
                                            "type": "string",
                                            "description": ""
                                        }
                                    ]
                                },
                                "max_batches": {
                                    "type": "number",
                                    "title": "Maximum Batches",
                                    "default": 10,
                                    "fieldDescription": [
                                        {
                                            "type": "string",
                                            "description": ""
                                        }
                                    ]
                                },
                                "pollingInterval": {
                                    "type": "string",
                                    "title": "Polling Interval",
                                    "enum": [
                                        "Once",
                                        "Periodic"
                                    ],
                                    "fieldDescription": [
                                        {
                                            "type": "string",
                                            "description": "Select polling interval"
                                        }
                                    ]
                                }
                            },
                            "dependencies": {
                                "pollingInterval": {
                                    "oneOf": [
                                        {
                                            "properties": {
                                                "pollingInterval": {
                                                    "enum": [
                                                        "Periodic"
                                                    ]
                                                },
                                                "schedule": {
                                                    "type": "string",
                                                    "title": "Schedule",
                                                    "enum": [
                                                        "Hourly",
                                                        "Daily",
                                                        "Weekly",
                                                        "Monthly"
                                                    ],
                                                    "fieldDescription": [
                                                        {
                                                            "type": "string",
                                                            "description": ""
                                                        }
                                                    ]
                                                }
                                            },
                                            "required": [
                                                "schedule"
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },
                "properties": {
                    "connector_config": {
                        "connection_info": {
                            "password": {
                                "ui:widget": "password"
                            }
                        }
                    },
                    "operations_config": {
                        "batch_size": {
                            "ui:readonly": true
                        },
                        "max_batches": {
                            "ui:readonly": true
                        }
                    }
                }
            },
            "created_by": "SYSTEM",
            "updated_by": "SYSTEM",
            "created_date": "2024-06-25T04:38:28.732Z",
            "updated_date": "2024-06-25T04:38:28.732Z",
            "live_date": "2024-06-25T04:38:28.732Z"
        }
    },

    DRAFT_CONNECTORS: {
        "id": "api.connectors.read",
        "ver": "v2",
        "ts": "2024-08-01T12:47:12+05:30",
        "params": {
            "status": "SUCCESS",
            "resmsgid": "b6fcfb05-246c-4a1b-9eb1-27497ee9b80b"
        },
        "responseCode": "OK",
        "result": {
            "id": "mssql-connector-2.0.0",
            "connector_id": "mssql-connector",
            "name": "MS SQL",
            "type": "source",
            "category": "Database",
            "version": "2.0.0",
            "description": "The MS SQL Connector is used to move data from any MS SQL Table to the Obsrv platform",
            "licence": "MIT",
            "owner": "Sunbird",
            "iconurl": "https://upload.wikimedia.org/wikipedia/commons/2/29/Microsoft_SQL_Server_Logo.svg",
            "status": "Draft",
            "ui_spec": {},
            "created_by": "SYSTEM",
            "updated_by": "SYSTEM",
            "created_date": "2024-06-25T04:38:28.847Z",
            "updated_date": "2024-06-25T04:38:28.847Z",
            "live_date": "2024-06-25T04:38:28.847Z"
        }
    }
}