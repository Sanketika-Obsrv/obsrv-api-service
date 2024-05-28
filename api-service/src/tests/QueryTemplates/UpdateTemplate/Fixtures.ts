export const updateTemplateFixtures = {
    SHOULD_HAVE_QUERY: {
        "id": "api.query.template.update",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "template_name": "sql_update_test_template",
            "query_type": "json"
        }
    },
    INVALID_NAME: {
        "id": "api.query.template.update",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "template_name": "sql_update_test_   template",
            "query_type": "json",
            "query": ""
        }
    },
    REQUIRED_VARIABLES_NOT_EXISTS: {
        "id": "api.query.template.update",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "template_name": "sql_update_test_template",
            "query_type": "json",
            "query": {}
        }
    },
    VALID_REQUEST_BODY: {
        "id": "api.query.template.update",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "template_name": "sql_update_test_template",
            "query_type": "sql",
            "query": "SELECT * FROM {{DATASET}} WHERE __time BETWEEN TIMESTAMP {{STARTDATE}} AND TIMESTAMP {{ENDDATE}} LIMIT {{LIMIT}}"
        }
    }
}