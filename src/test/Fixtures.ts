class TestDruidQuery {
  public static VALID_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"timeSeries","dataSource":"telemetry-events","aggregations":[{"type":"count","name":"count"}],"granularity":"all","postAggregations":[],"intervals": "2021-02-19/2021-02-20"}}';
  public static HIGH_DATE_RANGE_GIVEN_AS_LIST =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"groupBy","dataSource":"telemetry-events","dimensions":["actor_type","content_framework"],"limit":15, "metric":"count","granularity":"all","intervals":["2021-01-02/2021-02-05"],"aggregations":[{"type":"count","name":"count"}]}}';
  public static HIGH_DATE_RANGE_GIVEN_AS_STRING =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"topN","dataSource":"telemetry-events","dimension":"actor_id","threshold":10,"metric":"count","granularity":"all","intervals":"2020-12-30/2021-02-02","aggregations":[{"type":"count","name":"count"}]}}';
  public static HIGH_THRESHOLD_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"scan","dataSource":"telemetry-events","dimension":"mid","threshold":1000,"metric":"count","granularity":"all","intervals":["2020-12-31/2021-01-01"],"aggregations":[]}}';
  public static HIGH_LIMIT_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"scan","dataSource":"telemetry-events","granularity":"all","intervals":["2020-12-21/2021-01-01"],"resultFormat":"compactedList","limit":1000,"columns":["actor_id", "mid"],"metrics":{"type":"numeric","metric":"count"},"aggregations":[{"type":"count","name":"count"}]}}';
  public static WITHOUT_THRESOLD_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"timeBoundary","dataSource":"telemetry-events","dimension":"content_status","metric":"count","granularity":"all","intervals":["2020-12-21/2020-12-22"],"aggregations":[]}}';
  public static WITHOUT_DATE_RANGE_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"search","dataSource":"telemetry-events","granularity":"all","resultFormat":"compactedList","columns":["__time"],"metrics":{"type":"numeric","metric":"count"},"aggregations":[{"type":"count","name":"count"}]}}';
  public static UNSUPPORTED_DATA_SOURCE =
    '{"context":{"dataSource":"invalid_data_source"},"query":{"queryType":"timeBoundary","dataSource":"invalid_data_source","granularity":"all","intervals":["2022-10-17/2022-10-19"],"resultFormat":"compactedList","columns":["__time","scans"],"metrics":{"type":"numeric","metric":"count"},"aggregations":[{"type":"count","name":"count"}]}}';
  public static INVALID_QUERY_TYPE =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"invalidQueryType", "dataSource":"telemetry-events", "granularity":"all", "intervals":"2021-12-31/2022-01-20"}}';
  public static UNSUPPORTED_SCHEMA =
    '{"context":{},"query":{"queryType":"invalidQueryType", "dataSource":"telemetry-events", "granularity":"all", "intervals":"2021-12-31/2022-01-20"}}';
  public static VALID_SQL_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"querySql":{"query":"SELECT * FROM \\"telemetry-events\\" WHERE __time >= TIMESTAMP \'2020-12-31\' AND __time < TIMESTAMP \'2021-01-21\' LIMIT 10"}}';
  public static HIGH_LIMIT_SQL_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"querySql":{"query":"SELECT mid FROM \\"telemetry-events\\" WHERE __time >= TIMESTAMP \'2021-01-01\' AND __time < TIMESTAMP \'2021-01-22\' LIMIT 1000"}}';
  public static WITHOUT_LIMIT_SQL_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"querySql":{"query":"SELECT actor_type, content_status FROM \\"telemetry-events\\" WHERE __time >= TIMESTAMP \'2021-01-01\' AND __time < TIMESTAMP \'2021-01-02\'"}}';
  public static HIGH_DATE_RANGE_SQL_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"querySql":{"query":"SELECT actor_type, content_status FROM \\"telemetry-events\\" WHERE __time >= TIMESTAMP \'2021-01-01\' AND __time < TIMESTAMP \'2021-02-12\' LIMIT 10"}}';
  public static WITHOUT_DATE_RANGE_SQL_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"querySql":{"query":"SELECT content_status FROM \\"telemetry-events\\" LIMIT 5"}}';
  public static UNSUPPORTED_DATASOURCE_SQL_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"querySql":{"query":"SELECT __time FROM \\"invalid-datasource\\" LIMIT 10"}}';
}

class TestDataset {
  public static SAMPLE_INPUT = { "dataset": "telemetry-raw", "version": "v1.0", "data": [{ "eid": "SEARCH", "ver": "3.0", "syncts": 1595184155380, "ets": 1595184155380, "mid": "LP.1595184155380.f7537e7a-df01-43af-8f29-8e4d7a3607fa", "actor": { "id": "org.sunbird.learning.platform", "type": "System" }, "edata": { "type": "content" }, "@timestamp": "2020-07-19T18:42:41.524Z", "context": { "pdata": { "ver": "1.0", "id": "prod.diksha.portal", "pid": "search-service" }, "did": "79838ccb0ff2c7d0a9dd05f5b337fbca", "env": "search", "channel": "ROOT_ORG" }, "@version": "1", "object": { "id": "KLQ2G7", "type": "DialCode" } }] };
}

class TestDatasetSchema {
  public static SAMPLE_INPUT = { "dataset": "telemetry-raw", "version": 1.0, "dataSchema": { "type": "object", "properties": { "eid": { "type": "integer" }, "ver": { "type": "string" }, "syncts": { "type": "integer" }, "ets": { "type": "integer" }, "flags": { "type": "object", "properties": { "pp_validation_processed": { "type": "boolean" }, "pp_duplicate": { "type": "boolean" }, "device_denorm": { "type": "boolean" }, "dialcode_denorm": { "type": "boolean" }, "content_denorm": { "type": "boolean" } }, "required": ["pp_validation_processed", "pp_duplicate", "device_denorm", "dialcode_denorm", "content_denorm"] }, "mid": { "type": "string" }, "type": { "type": "string" }, "tags": { "type": "array", "items": { "type": "string" } }, "actor": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] }, "edata": { "type": "object", "properties": { "topn": { "type": "array", "items": { "type": "object", "properties": { "identifier": { "type": "string" } }, "required": ["identifier"] } }, "query": { "type": "string" }, "size": { "type": "integer" }, "type": { "type": "string" }, "filters": { "type": "object", "properties": { "contentType": { "type": "array", "items": { "type": "string" } }, "mimeType": { "type": "object" }, "resourceType": { "type": "object" }, "status": { "type": "array", "items": { "type": "string" } }, "objectType": { "type": "array", "items": { "type": "string" } }, "dialcodes": { "type": "string" }, "framework": { "type": "object" }, "compatibilityLevel": { "type": "object", "properties": { "max": { "type": "integer" }, "min": { "type": "integer" } }, "required": ["max", "min"] }, "channel": { "type": "object", "properties": { "ne": { "type": "array", "items": { "type": "string" } } }, "required": ["ne"] } }, "required": ["contentType", "mimeType", "resourceType", "status", "objectType", "dialcodes", "framework", "compatibilityLevel", "channel"] }, "sort": { "type": "object" } }, "required": ["topn", "query", "size", "type", "filters", "sort"] }, "@timestamp": { "type": "integer" }, "context": { "type": "object", "properties": { "pdata": { "type": "object", "properties": { "ver": { "type": "string" }, "id": { "type": "string" }, "pid": { "type": "string" } }, "required": ["ver", "id", "pid"] }, "did": { "type": "string" }, "env": { "type": "string" }, "channel": { "type": "string" } }, "required": ["pdata", "did", "env", "channel"] }, "@version": { "type": "string" }, "object": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] } }, "required": ["eid", "ver", "syncts", "ets", "flags", "mid", "type", "tags", "actor", "edata", "@timestamp", "context", "@version", "object"] }, "ingestionSchema": { "type": "kafka", "spec": { "dataSchema": { "dataSource": "obsrv-telemetry-events", "dimensionsSpec": { "dimensions": [{ "type": "string", "name": "ver" }, { "type": "timestamp", "name": "ets" }, { "type": "boolean", "name": "flags_pp_validation_processed" }, { "type": "boolean", "name": "flags_pp_duplicate" }, { "type": "boolean", "name": "flags_device_denorm" }, { "type": "boolean", "name": "flags_dialcode_denorm" }, { "type": "boolean", "name": "flags_content_denorm" }, { "type": "string", "name": "mid" }, { "type": "string", "name": "type" }, { "type": "array", "name": "tags" }, { "type": "string", "name": "actor_id" }, { "type": "string", "name": "actor_type" }, { "type": "string", "name": "edata_topn[*]_identifier" }, { "type": "string", "name": "edata_query" }, { "type": "string", "name": "edata_type" }, { "type": "array", "name": "edata_filters_contentType" }, { "type": "object", "name": "edata_filters_mimeType" }, { "type": "object", "name": "edata_filters_resourceType" }, { "type": "array", "name": "edata_filters_status" }, { "type": "array", "name": "edata_filters_objectType" }, { "type": "string", "name": "edata_filters_dialcodes" }, { "type": "object", "name": "edata_filters_framework" }, { "type": "array", "name": "edata_filters_channel_ne" }, { "type": "object", "name": "edata_sort" }, { "type": "string", "name": "context_pdata_ver" }, { "type": "string", "name": "context_pdata_id" }, { "type": "string", "name": "context_pdata_pid" }, { "type": "string", "name": "context_did" }, { "type": "string", "name": "context_env" }, { "type": "string", "name": "context_channel" }, { "type": "string", "name": "@version" }, { "type": "string", "name": "object_id" }, { "type": "string", "name": "object_type" }] }, "timestampSpec": { "column": "ets", "format": "auto" }, "metricsSpec": [{ "type": "doubleSum", "name": "eid", "fieldName": "eid" }, { "type": "doubleSum", "name": "syncts", "fieldName": "syncts" }, { "type": "doubleSum", "name": "edata_size", "fieldName": "edata_size" }, { "type": "doubleSum", "name": "edata_filters_compatibilityLevel_max", "fieldName": "edata_filters_compatibilityLevel_max" }, { "type": "doubleSum", "name": "edata_filters_compatibilityLevel_min", "fieldName": "edata_filters_compatibilityLevel_min" }, { "type": "doubleSum", "name": "@timestamp", "fieldName": "@timestamp" }], "granularitySpec": { "type": "uniform", "segmentGranularity": "DAY", "queryGranularity": "HOUR", "rollup": false } }, "tuningConfig": { "type": "kafka", "maxRowsPerSegment": 50000, "logParseExceptions": true }, "ioConfig": { "type": "kafka", "topic": "obsrv.telemetry.input", "consumerProperties": { "bootstrap.servers": "localhost:9092" }, "taskCount": 1, "replicas": 1, "taskDuration": "PT8H", "useEarliestOffset": false, "completionTimeout": "PT8H", "inputFormat": { "type": "json", "flattenSpec": { "useFieldDiscovery": true, "fields": [{ "type": "path", "expr": "$.eid", "name": "eid" }, { "type": "path", "expr": "$.syncts", "name": "syncts" }, { "type": "path", "expr": "$.edata.size", "name": "edata_size" }, { "type": "path", "expr": "$.edata.filters.compatibilityLevel.max", "name": "edata_filters_compatibilityLevel_max" }, { "type": "path", "expr": "$.edata.filters.compatibilityLevel.min", "name": "edata_filters_compatibilityLevel_min" }, { "type": "path", "expr": "$.@timestamp", "name": "@timestamp" }, { "type": "path", "expr": "$.flags.content_denorm", "name": "flags_content_denorm" }, { "type": "path", "expr": "$.mid", "name": "mid" }, { "type": "path", "expr": "$.type", "name": "type" }, { "type": "path", "expr": "$.tags[*]", "name": "tags" }, { "type": "path", "expr": "$.actor.id", "name": "actor_id" }, { "type": "path", "expr": "$.actor.type", "name": "actor_type" }, { "type": "path", "expr": "$.edata.topn[*].identifier", "name": "edata_topn[*]_identifier" }, { "type": "path", "expr": "$.edata.query", "name": "edata_query" }, { "type": "path", "expr": "$.edata.type", "name": "edata_type" }, { "type": "path", "expr": "$.edata.filters.contentType[*]", "name": "edata_filters_contentType" }, { "type": "path", "expr": "$.edata.filters.mimeType", "name": "edata_filters_mimeType" }, { "type": "path", "expr": "$.edata.filters.resourceType", "name": "edata_filters_resourceType" }, { "type": "path", "expr": "$.edata.filters.status[*]", "name": "edata_filters_status" }, { "type": "path", "expr": "$.edata.filters.objectType[*]", "name": "edata_filters_objectType" }, { "type": "path", "expr": "$.edata.filters.dialcodes", "name": "edata_filters_dialcodes" }, { "type": "path", "expr": "$.edata.filters.framework", "name": "edata_filters_framework" }, { "type": "path", "expr": "$.edata.filters.channel.ne[*]", "name": "edata_filters_channel_ne" }, { "type": "path", "expr": "$.edata.sort", "name": "edata_sort" }, { "type": "path", "expr": "$.context.pdata.ver", "name": "context_pdata_ver" }, { "type": "path", "expr": "$.context.pdata.id", "name": "context_pdata_id" }, { "type": "path", "expr": "$.context.pdata.pid", "name": "context_pdata_pid" }, { "type": "path", "expr": "$.context.did", "name": "context_did" }, { "type": "path", "expr": "$.context.env", "name": "context_env" }, { "type": "path", "expr": "$.context.channel", "name": "context_channel" }, { "type": "path", "expr": "$.@version", "name": "@version" }, { "type": "path", "expr": "$.object.id", "name": "object_id" }, { "type": "path", "expr": "$.object.type", "name": "object_type" }] } }, "appendToExisting": false } } }, "config": { "ingestion": { "indexCol": "syncts", "rollup": true, "granulariy": { "segments": "DAY", "query": "MINUTE" }, "taskCount": 1, "taskDuration": "PT3600S", "replicas": 1 }, "querying": { "rules": [{ "dataset": "telemetry-raw", "queryRules": { "groupBy": { "maxDateRange": 30 }, "scan": { "maxDateRange": 30 }, "maxResponseSize": 5000 } }] }, "processing": { "checkpointingInterval": 6000, "dedup": { "property": "mid", "retentionPeriod": 3600000 }, "consumerPrallelism": 1, "downStreamParallelism": 1, "compression": "snappy", "dataSize": 1572864 } } };
  public static MISSING_FIELDS = { "dataset": "telemetry-raw", "version": 1.0, "dataSchema": {}, "ingestionSchema": {} };
  public static INCORRECT_FIELD_FORMAT = { "dataset": "telemetry-raw", "version": 1.0, "dataSchema": "given as string instead of json", "ingestionSchema": {}, "config": { "ingestion": {}, "processing": {}, "querying": {} } }

}

class TestDatasetSchemaGeneration {
  public static SIMPLE_JSON_INPUT = { "data": [{ "eid": "SEARCH", "ver": "3.0", "syncts": 1595184155380, "ets": 1595184155380, "number": 124, "flags": { "pp_validation_processed": true, "pp_duplicate": false, "device_denorm": false, "dialcode_denorm": true, "content_denorm": false } }], "config": { "dataSet": "obsrv-telemetry-events" } };
  public static NESTED_JSON_INPUT = { "data": [{ "eid": "SEARCH", "ver": "3.0", "syncts": 1595184155380, "ets": 1595184155380, "number": 124, "flags": { "pp_validation_processed": true, "pp_duplicate": false, "device_denorm": false, "dialcode_denorm": true, "content_denorm": false }, "tags": ["kp-events"], "edata": { "topn": [{ "identifier": "do_312528046917705728246886" }], "limits": "resource", "size": 7, "type": "content", "filters": { "contentType": ["TextBookUnit", "Resource", "TextBook", "Collection", "Course"], "dialcodes": "KLQ2G7", "compatibilityLevel": { "max": 4, "min": 1 }, "channel": { "ne": ["0124433024890224640", "0124446042259128320"] } } } }], "config": { "dataSet": "obsrv-telemetry-events" } }
}

class TestIngestionSchema {
  public static SIMPLE_JSON_INPUT = { "data": { "type": "object", "properties": { "eid": { "type": "string" }, "ver": { "type": "string" }, "syncts": { "type": "integer" }, "ets": { "type": "integer" }, "number": { "type": "integer" }, "channel": { "type": "object", "properties": { "ne": { "type": "array", "items": { "type": "string" } } }, "required": ["ne"] } }, "required": ["eid", "ver", "syncts", "ets", "number", "channel"] }, "config": { "dataSet": "obsrv-telemetry-events", "indexCol": "ets", "granularitySpec": { "segmentGranularity": "DAY", "queryGranularity": "HOUR", "rollup": false }, "tuningConfig": { "maxRowPerSegment": 50000, "taskCount": 1 }, "ioConfig": { "topic": "obsrv.telemetry.input", "bootstrapIp": "localhost:9092", "taskDuration": "PT8H" } } };
  public static NESTED_JSON_INPUT = { "data": { "type": "object", "properties": { "eid": { "type": "string" }, "ver": { "type": "string" }, "syncts": { "type": "integer" }, "ets": { "type": "integer" }, "number": { "type": "integer" }, "channel": { "type": "object", "properties": { "ne": { "type": "array", "items": { "type": "object", "properties": { "type": "string" } } } }, "required": ["ne"] }, "sort": { "type": "object" } }, "required": ["eid", "ver", "syncts", "ets", "number", "channel"] }, "config": { "dataSet": "obsrv-telemetry-events", "indexCol": "ets", "granularitySpec": { "segmentGranularity": "DAY", "queryGranularity": "HOUR", "rollup": false }, "tuningConfig": { "taskCount": 1 }, "ioConfig": { "topic": "obsrv.telemetry.input", "bootstrapIp": "localhost:9092", "taskDuration": "PT8H" } } };
}

export { TestDruidQuery, TestDataset, TestDatasetSchema, TestDatasetSchemaGeneration, TestIngestionSchema };