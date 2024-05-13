export const createTemplateFixtures = {
    VALID_TEMPLATE: {
        "id": "api.query.template.create",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "template_name": "json11template",
            "query_type": "json",
            "query": {
                "queryType": "select",
                "datasetId": "{{DATASET}}",
                "intervals": "{{STARTDATE}}/{{ENDDATE}}",
                "limit": "{{LIMITS}}"
            }
        }
    },
    INVALID_TEMPLATE: {
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "template_name": "json11template",
            "query_type": "json",
            "query": {
                "queryType": "select",
                "datasetId": "{{DATASET}}",
                "intervals": "{{STARTDATE}}/{{ENDDATE}}",
                "limit": "{{LIMITS}}"
            }
        }
    },
    INVALID_NAME: {
        "id": "api.query.template.create",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "template_name": "json   11template",
            "query_type": "json",
            "query": {
                "queryType": "select",
                "datasetId": "{{DATASET}}",
                "intervals": "{{STARTDATE}}/{{ENDDATE}}",
                "limit": "{{LIMITS}}"
            }
        }
    },
    REQUIRED_VARIABLES_NOT_EXISTS: {
        "id": "api.query.template.create",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "template_name": "json11template",
            "query_type": "json",
            "query": {
                "queryType": "select",
                "datasetId": "{{DATASET}}",
                "intervals": "{{STARTDATE}}/{{ENATE}}",
                "limit": "{{LIMITS}}"
            }
        }
    }
}