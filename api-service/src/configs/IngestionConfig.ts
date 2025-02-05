import { config } from "./Config";

const env = process.env;

export const ingestionConfig = {
    "indexCol": { "Event Arrival Time": "obsrv_meta.syncts" },
    "granularitySpec": {
        "rollup": false,
        "segmentGranularity": env.segment_granularity || "DAY"
    },
    "ioconfig": { "topic": "", "taskDuration": "PT1H" },
    "tuningConfig": { "maxRowPerSegment": 5000000, "taskCount": 1 },
    "query_granularity": "none",
    "use_earliest_offset": true,
    "completion_timeout": "PT1H",
    "maxBytesInMemory": env.max_bytes_in_memory || 134217728,
    "syncts_path": "$.obsrv_meta.syncts",
}

export const rawIngestionSpecDefaults = {
    "granularitySpec": {
        "type": "uniform",
        "rollup": false,
        "segmentGranularity": env.segment_granularity || "DAY",
        "queryGranularity": "none"
    },
    "tuningConfig": {
        "type": "kafka",
        "maxBytesInMemory": env.max_bytes_in_memory || 134217728,
        "maxRowsPerSegment": env.max_rows_per_segment || 5000000,
        "logParseExceptions": true
    },
    "ioConfig": {
        "type": "kafka",
        "topic": "",
        "consumerProperties": { "bootstrap.servers": config.telemetry_service_config.kafka.config.brokers[0] },
        "taskCount": env.supervisor_task_count || 1,
        "replicas": 1,
        "taskDuration": env.default_task_duration || "PT4H",
        "useEarliestOffset": true,
        "completionTimeout": env.default_task_duration || "PT4H",
        "inputFormat": {
            "type": "json", 
            "flattenSpec": {
                "useFieldDiscovery": true
            }
        },
        "appendToExisting": false
    },
    "synctsField": {
        "name": "obsrv_meta.syncts",
        "arrival_format": "text",
        "data_type": "date",
        "type": "text",
        "expr": "$.obsrv_meta.syncts"
    },
    "hudiSynctsField": {
        "name": "obsrv_meta_syncts",
        "arrival_format": "text",
        "data_type": "date",
        "type": "text",
        "expr": "$.obsrv_meta.syncts"
    },
    "dimensions": [
        {
            "type": "string",
            "name": "obsrv.meta.source.connector"
        },
        {
            "type": "string",
            "name": "obsrv.meta.source.id"
        }
    ],
    "hudi_dimensions": [
        {
            "type": "string",
            "name": "obsrv_meta_source_connector"
        },
        {
            "type": "string",
            "name": "obsrv_meta_source_id"
        }
    ],
    "flattenSpec": [
        {
            "type": "path",
            "expr": "$.obsrv_meta.source.connector",
            "name": "obsrv.meta.source.connector"
        },
        {
            "type": "path",
            "expr": "$.obsrv_meta.source.connectorInstance",
            "name": "obsrv.meta.source.id"
        }
    ],
    "hudi_flattenSpec": [
        {
            "type": "path",
            "expr": "$.obsrv_meta.source.connector",
            "name": "obsrv_meta_source_connector"
        },
        {
            "type": "path",
            "expr": "$.obsrv_meta.source.connectorInstance",
            "name": "obsrv_meta_source_id"
        }
    ]
}