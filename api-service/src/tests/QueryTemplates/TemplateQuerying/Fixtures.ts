export const templateQueryApiFixtures = {
    VALID_REQUEST_BODY: {
        "id": "api.query.template.query",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "startdate": "2020-12-31",
            "enddate": "2024-12-31",
            "aggregationLevel": "month",
            "dataset": "test",
        }
    },
    VALID_REQUEST_BODY_NATIVE_TEMPLATE: {
        "id": "api.query.template.query",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "startdate": "2020-12-31",
            "enddate": "2024-12-31",
            "aggregationLevel": "month",
            "dataset": "test",
            "limit": 1
        }
    },
    INVALID_REQUEST_BODY: {
        "id": "api.query.template.query",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "enddate": "2024-12-31",
            "aggregationLevel": "month",
            "dataset": "test",
        }
    },
}