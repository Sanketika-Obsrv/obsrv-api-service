export const listTemplateFixtures = {
    WITH_EMPTY_REQUEST_BODY: {
        "id": "api.query.template.list",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {

        }
    },
    INVALID_REQUEST_BODY: {
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {

        }
    },
    ORDER_BY_REQUEST: {
        "id": "api.query.template.list",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "order": [
                [
                    "created_date",
                    "ASC"
                ]
            ]
        }
    },
    FILTER_REQUEST: {
        "id": "api.query.template.list",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "filters": {
                "query_type": "sql"
            }
        }
    },
    LIMIT_AND_OFFSET_REQUEST: {
        "id": "api.query.template.list",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "limit": 5,
            "offset": 0
        }
    },
    EMPTY_REQUEST_RESPONSE: [
        {
            dataValues: {
                "template_id": "josnaksaaa",
                "template_name": "JOSnaks--aaa",
                "query": "{\"queryType\":\"select\",\"datasetId\":\"{{DATASET}}\",\"intervals\":\"{{STARTDATE}}/{{ENDDATE}}\",\"limit\":\"{{LIMITS}}\"}",
                "query_type": "json",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-25T06:25:04.706Z",
                "updated_date": "2024-04-25T06:25:04.706Z"
            }
        },
        {
            dataValues: {
                "template_id": "josnaks-aaa",
                "template_name": "JOSnaks--aaa",
                "query": "{\"queryType\":\"select\",\"datasetId\":\"{{DATASET}}\",\"intervals\":\"{{STARTDATE}}/{{ENDDATE}}\",\"limit\":\"{{LIMITS}}\"}",
                "query_type": "json",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-25T06:26:35.749Z",
                "updated_date": "2024-04-25T06:26:35.749Z"
            }
        },
        {
            dataValues: {
                "template_id": "a",
                "template_name": " a",
                "query": "{\"queryType\":\"select\",\"datasetId\":\"{{DATASET}}\",\"intervals\":\"{{STARTDATE}}/{{ENDDATE}}\",\"limit\":\"{{LIMITS}}\"}",
                "query_type": "json",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-25T06:30:50.179Z",
                "updated_date": "2024-04-25T06:30:50.179Z"
            }
        },
        {
            dataValues: {
                "template_id": "yash-k",
                "template_name": "yash k",
                "query": "{\"queryType\":\"select\",\"datasetId\":\"{{DATASET}}\",\"intervals\":\"{{STARTDATE}}/{{ENDDATE}}\",\"limit\":\"{{LIMITS}}\"}",
                "query_type": "json",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-25T06:31:08.821Z",
                "updated_date": "2024-04-25T06:31:08.821Z"
            }
        },
        {
            dataValues: {
                "template_id": "yashas-k",
                "template_name": "yashas  k",
                "query": "{\"queryType\":\"select\",\"datasetId\":\"{{DATASET}}\",\"intervals\":\"{{STARTDATE}}/{{ENDDATE}}\",\"limit\":\"{{LIMITS}}\"}",
                "query_type": "json",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-25T06:31:20.819Z",
                "updated_date": "2024-04-25T06:31:20.819Z"
            }
        },
        {
            dataValues: {
                "template_id": "yashash-ak",
                "template_name": "YASHASH ak",
                "query": "{\"queryType\":\"select\",\"datasetId\":\"{{DATASET}}\",\"intervals\":\"{{STARTDATE}}/{{ENDDATE}}\",\"limit\":\"{{LIMITS}}\"}",
                "query_type": "json",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-25T06:33:56.501Z",
                "updated_date": "2024-04-25T06:33:56.501Z"
            }
        },
        {
            dataValues: {
                "template_id": "test_template",
                "template_name": "test template",
                "query": "{\"queryType\":\"select\",\"datasetId\":\"{{DATASET}}\",\"intervals\":\"{{STARTDATE}}/{{ENDDATE}}\",\"limit\":\"{{LIMITS}}\"}",
                "query_type": "json",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-26T00:24:34.435Z",
                "updated_date": "2024-04-26T00:24:34.435Z"
            }
        },
        {
            dataValues: {
                "template_id": "jsontemplate",
                "template_name": "jsontemplate",
                "query": "{\"queryType\":\"select\",\"datasetId\":\"{{DATASET}}\",\"intervals\":\"{{STARTDATE}}/{{ENDDATE}}\",\"limit\":\"{{LIMITS}}\"}",
                "query_type": "json",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-28T23:27:32.113Z",
                "updated_date": "2024-04-28T23:27:32.113Z"
            }
        }
    ],
    ORDER_BY_RESPONSE: [
        {
            dataValues: {
                "template_id": "sql11template",
                "template_name": "sql11template",
                "query": "\"SELECT COUNT(*) FROM \\\"{{DATASET}}\\\" WHERE \\\"__time\\\" BETWEEN TIMESTAMP \\\"{{STARTDATE}}\\\" AND TIMESTAMP \\\"{{ENDDATE}}\\\"\"",
                "query_type": "sql",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-21T01:30:59.381Z",
                "updated_date": "2024-04-21T01:30:59.381Z"
            }
        },
        {
            dataValues: {
                "template_id": "sql11template1",
                "template_name": "sql11template1",
                "query": "\"SELECT COUNT(*) FROM \\\"{{DATASET}}\\\" WHERE \\\"__time\\\" BETWEEN TIMESTAMP \\\"{{STARTDATE}}\\\" AND TIMESTAMP \\\"{{ENDDATE}}\\\"\"",
                "query_type": "sql",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-22T01:31:53.976Z",
                "updated_date": "2024-04-22T01:31:53.976Z"
            }
        },
        {
            dataValues: {
                "template_id": "josnaksaaa",
                "template_name": "JOSnaks--aaa",
                "query": "{\"queryType\":\"select\",\"datasetId\":\"{{DATASET}}\",\"intervals\":\"{{STARTDATE}}/{{ENDDATE}}\",\"limit\":\"{{LIMITS}}\"}",
                "query_type": "json",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-25T06:25:04.706Z",
                "updated_date": "2024-04-25T06:25:04.706Z"
            }
        },
        {
            dataValues: {
                "template_id": "josnaks-aaa",
                "template_name": "JOSnaks--aaa",
                "query": "{\"queryType\":\"select\",\"datasetId\":\"{{DATASET}}\",\"intervals\":\"{{STARTDATE}}/{{ENDDATE}}\",\"limit\":\"{{LIMITS}}\"}",
                "query_type": "json",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-25T06:26:35.749Z",
                "updated_date": "2024-04-25T06:26:35.749Z"
            }
        },
        {
            dataValues: {
                "template_id": "a",
                "template_name": " a",
                "query": "{\"queryType\":\"select\",\"datasetId\":\"{{DATASET}}\",\"intervals\":\"{{STARTDATE}}/{{ENDDATE}}\",\"limit\":\"{{LIMITS}}\"}",
                "query_type": "json",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-25T06:30:50.179Z",
                "updated_date": "2024-04-25T06:30:50.179Z"
            }
        },
    ],
    FILTER_RESPONSE: [
        {
            dataValues: {
                "template_id": "sql_template",
                "template_name": "sql template",
                "query": "\"SELECT COUNT(*) FROM \\\"{{DATASET}}\\\" WHERE \\\"__time\\\" BETWEEN TIMESTAMP \\\"{{STARTDATE}}\\\" AND TIMESTAMP \\\"{{ENDDATE}}\\\"\"",
                "query_type": "sql",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-29T01:24:03.511Z",
                "updated_date": "2024-04-29T01:24:03.511Z"
            }
        },
        {
            dataValues: {
                "template_id": "sql1template",
                "template_name": "sql1template",
                "query": "\"SELECT COUNT(*) FROM \\\"{{DATASET}}\\\" WHERE \\\"__time\\\" BETWEEN TIMESTAMP \\\"{{STARTDATE}}\\\" AND TIMESTAMP \\\"{{ENDDATE}}\\\"\"",
                "query_type": "sql",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-29T01:26:28.381Z",
                "updated_date": "2024-04-29T01:26:28.381Z"
            }
        },
        {
            dataValues: {
                "template_id": "sql_template_1",
                "template_name": "sql template 1",
                "query": "\"SELECT COUNT(*) FROM \\\"{{DATASET}}\\\" WHERE \\\"__time\\\" BETWEEN TIMESTAMP \\\"{{STARTDATE}}\\\" AND TIMESTAMP \\\"{{ENDDATE}}\\\"\"",
                "query_type": "sql",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-29T01:36:01.592Z",
                "updated_date": "2024-04-29T01:36:01.592Z"
            }
        },
        {
            dataValues: {
                "template_id": "sql_template_11",
                "template_name": "sql template 11",
                "query": "\"SELECT COUNT(*) FROM \\\"{{DATASET}}\\\" WHERE \\\"__time\\\" BETWEEN TIMESTAMP \\\"{{STARTDATE}}\\\" AND TIMESTAMP \\\"{{ENDDATE}}\\\"\"",
                "query_type": "sql",
                "created_by": "SYSTEM",
                "updated_by": "SYSTEM",
                "created_date": "2024-04-29T01:39:29.968Z",
                "updated_date": "2024-04-29T01:39:29.968Z"
            }
        }]
}