
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
