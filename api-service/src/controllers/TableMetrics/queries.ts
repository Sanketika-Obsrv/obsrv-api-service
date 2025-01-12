export const processingTimeQuery = (intervals: string, dataset: string) => ({
    query: {
      queryType: "groupBy",
      dataSource: "system-events",
      intervals: intervals,
      granularity: {
        type: "all",
        timeZone: "Asia/Kolkata"
      },
      filter: {
        type: "and",
        fields: [
          { type: "selector", dimension: "ctx_module", value: "processing" },
          { type: "selector", dimension: "ctx_dataset", value: dataset },
          { type: "selector", dimension: "ctx_pdata_pid", value: "router" },
          { type: "selector", dimension: "error_code", value: null }
        ]
      },
      aggregations: [
        { type: "longSum", name: "processing_time", fieldName: "total_processing_time" },
        { type: "longSum", name: "count", fieldName: "count" }
      ],
      postAggregations: [
        {
          type: "expression",
          name: "average_processing_time",
          expression: "case_searched((count > 0),(processing_time/count),0)"
        }
      ]
    }
  });

  export const totalEventsQuery = (intervals: string, dataset: string) => ({
    queryType: "timeseries",
    dataSource: {
      type: "table",
      name: "system-events"
    },
    intervals: {
      type: "intervals",
      intervals: [intervals]
    },
    filter: {
      type: "equals",
      column: "ctx_dataset",
      matchValueType: "STRING",
      matchValue: dataset
    },
    granularity: {
      type: "all"
    },
    aggregations: [
      {
        type: "longSum",
        name: "total_events_count",
        fieldName: "count"
      }
    ],
    context: {
      queryId: "02dd33a4-5f3c-4b7e-8d21-56769799d413",
      sqlOuterLimit: 1001,
      sqlQueryId: "02dd33a4-5f3c-4b7e-8d21-56769799d413",
      useNativeQueryExplain: true
    }
  });
  
  export const totalFailedEventsQuery = (intervals: string, dataset: string) => ({
    queryType: "timeseries",
    dataSource: {
      type: "table",
      name: "system-events"
    },
    intervals: {
      type: "intervals",
      intervals: [intervals]
    },
    filter: {
      type: "equals",
      column: "ctx_dataset",
      matchValueType: "STRING",
      matchValue: dataset
    },
    granularity: {
      type: "all"
    },
    aggregations: [
      {
        type: "filtered",
        aggregator: {
          type: "longSum",
          name: "total_failed_events",
          fieldName: "count"
        },
        filter: {
          type: "and",
          fields: [
            {
              type: "equals",
              column: "ctx_pdata_pid",
              matchValueType: "STRING",
              matchValue: "validator"
            },
            {
              type: "equals",
              column: "error_pdata_status",
              matchValueType: "STRING",
              matchValue: "failed"
            }
          ]
        },
        name: "total_failed_events"
      }
    ],
    context: {
      queryId: "acf3990b-1c9e-42a6-9960-eb85a115ca65",
      sqlOuterLimit: 1001,
      sqlQueryId: "acf3990b-1c9e-42a6-9960-eb85a115ca65",
      useNativeQueryExplain: true
    }
  });

  export const generateTimeseriesQuery = (intervals: string, dataset: string) => ({
    queryType: "timeseries",
    dataSource: "system-events",
    intervals: intervals,
    granularity: {
      type: "all",
      timeZone: "Asia/Kolkata"
    },
    filter: {
      type: "and",
      fields: [
        { type: "selector", dimension: "ctx_module", value: "processing" },
        { type: "selector", dimension: "ctx_dataset", value: dataset },
        { type: "selector", dimension: "ctx_pdata_pid", value: "router" },
        { type: "selector", dimension: "error_code", value: null }
      ]
    },
    aggregations: [
      { type: "longSum", name: "count", fieldName: "count" }
    ]
  });