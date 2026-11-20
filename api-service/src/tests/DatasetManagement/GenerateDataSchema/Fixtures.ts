export const TestInputsForGenerateDataSchema = {
    SAMPLE_WITH_NULL_FIELD: {
        "id": "api.datasets.dataschema",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "data": [
                {
                    "customer_id": "c-001",
                    "amount": 100,
                    "promo_code": null
                }
            ],
            "config": {
                "dataset": "test_dataset"
            }
        }
    },
    SAMPLE_WITH_MIXED_NULL_AND_TYPED_FIELD: {
        "id": "api.datasets.dataschema",
        "ver": "v2",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "5b8f25d4-e72f-5e5f-cf89-292945ffgg7e"
        },
        "request": {
            "data": [
                { "customer_id": "c-001", "amount": 100, "discount_code": "SAVE10" },
                { "customer_id": "c-002", "amount": 200, "discount_code": null },
                { "customer_id": "c-003", "amount": 300, "discount_code": "SAVE20" }
            ],
            "config": {
                "dataset": "test_dataset"
            }
        }
    }
};
