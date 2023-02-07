export const suggestions = {
    "CONFIG_TEMPLATE": {
        "config": {
                "update": {
                    "message": "Updated the exisitng config property:(dedup), actual: did, expected:mid",
                    "advice": {
                        "dedup": "The chance of duplicating the data is higher",
                        "queryRules": "The integrated query apis might misbehave",
                    }
                }
        }
    },
    "DATATYPE_TEMPLATE": {
        "schema": {
            "update": {
                "message": "Updated the exisitng data type property:required, actual: true, expected:false",
                "advice": {
                    "dataType": "Might Required to reprocess the existing data",
                    "required": "Might Required to reprocess the existing data"
                }
            },
            "create": {
                "message": "Object (eid) Property Conflict, property:data_type, found (int (2 nos), string (3nos))",
                "advice": {
                    "dataType": "System has choosen highest occurance value",
                    "required": "System has choosen highest occurance value"
                }
            }
        }
    },

    "SCHEMA_FAILURE": {
        "schema": {
            "update": {
                "message": "Updated the exisitng data type property:required, actual: true, expected:false",
                "advice": {
                    "dataType": "Might Required to reprocess the existing data",
                    "required": "Might Required to reprocess the existing data"
                }
            },
            "create": {
                "message": "Object (eid) Property Conflict, property:data_type, found (int (2 nos), string (3nos))",
                "advice": {
                    "dataType": "System has choosen highest occurance value",
                    "required": "System has choosen highest occurance value"
                }
            }
        }
    }


}
