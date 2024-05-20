export const datasetCopyFixtures = {
    VALID_REQUEST_BODY: {
        "id": "api.dataset.copy",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "datasetId": "test_dataset",
            "isLive": true,
            "newDatasetId": "sampletestcopy1"
        }
    },
    READ_DATASET_RESPONSE: {
        id: 'test_dataset.1',
        dataset_id: 'test_dataset',
        type: 'dataset',
        name: 'test_dataset'
    },
    READ_DATASOURCE_RESPONSE: [
        {
            id: 'test_dataset_test_dataset.1_day',
            datasource: 'test_dataset.1_day',
            dataset_id: 'test_dataset',
            ingestion_spec: [Object],
            datasource_ref: 'test_dataset.1_day',
            retention_period: [Object],
            archival_policy: [Object],
            purge_policy: [Object],
            backup_config: [Object],
            status: 'Live',
            created_by: 'SYSTEM',
            updated_by: 'SYSTEM',
            published_date: "2024-05-17T12:28:08.325Z",
            metadata: [Object],
            created_date: "2024-05-17T12:28:08.325Z",
            updated_date: "2024-05-17T12:28:08.325Z"
        }
    ],
    READ_DATASET_SOURCE_CONFIG_RESPONSE: [
        {
            id: 'test_dataset.1_kafka',
            dataset_id: 'test_dataset',
            connector_type: 'kafka',
            connector_config: [Object],
            status: 'Live',
            connector_stats: {},
            created_by: 'SYSTEM',
            updated_by: 'SYSTEM',
            published_date: "2024-05-17T12:28:08.379Z",
            created_date: "2024-05-17T12:28:08.379Z",
            updated_date: "2024-05-17T12:28:08.379Z"
        }
    ],
    READ_DATASET_TRANSFORMATIONS_RESPONSE: [
        {
            id: 'test_dataset_actor.id',
            dataset_id: 'test_dataset',
            field_key: 'actor.id',
            transformation_function: [Object],
            mode: 'Strict',
            metadata: [Object],
            status: 'Live',
            created_by: 'SYSTEM',
            updated_by: 'SYSTEM',
            published_date: "2024-05-17T12:28:08.404Z",
            created_date: "2024-05-17T12:28:08.404Z",
            updated_date: "2024-05-17T12:28:08.404Z"
        }
    ],
    INVALID_REQUEST_BODY: {
        "id": "api.dataset.copy",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "datasetId": "test_dataset",
            "newDatasetId": "sampletestcopy1"
        }
    },
    DRAFT_VALID_REQUEST_BODY: {
        "id": "api.dataset.copy",
        "ver": "v1",
        "ts": "2024-04-10T16:10:50+05:30",
        "params": {
            "msgid": "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
        },
        "request": {
            "datasetId": "test_dataset",
            "isLive": false,
            "newDatasetId": "sampletestcopy1"
        }
    },
}