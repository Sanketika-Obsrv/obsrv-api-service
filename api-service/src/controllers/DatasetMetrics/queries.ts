import dayjs from "dayjs";

export const processingTimeQuery = (intervals: string, dataset_id: string) => ({
  query: {
    queryType: "groupBy",
    dataSource: "system-events",
    intervals: intervals,
    granularity: {
      type: "all",
      timeZone: "UTC"
    },
    filter: {
      type: "and",
      fields: [
        { type: "selector", dimension: "ctx_module", value: "processing" },
        { type: "selector", dimension: "ctx_dataset", value: dataset_id },
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

export const totalEventsQuery = (intervals: string, dataset_id: string) => ({
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
    matchValue: dataset_id
  },
  granularity: {
    type: "all",
    timeZone: "UTC"
  },
  aggregations: [
    {
      type: "longSum",
      name: "total_events_count",
      fieldName: "count"
    }
  ]
});

export const totalFailedEventsQuery = (intervals: string, dataset_id: string) => ({
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
    matchValue: dataset_id
  },
  granularity: {
    type: "all",
    timeZone: "UTC"
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
  ]
});

export const generateTimeseriesQuery = (intervals: string, dataset_id: string) => ({
  queryType: "timeseries",
  dataSource: "system-events",
  intervals: intervals,
  granularity: {
    type: "all",
    timeZone: "UTC"
  },
  filter: {
    type: "and",
    fields: [
      { type: "selector", dimension: "ctx_module", value: "processing" },
      { type: "selector", dimension: "ctx_dataset", value: dataset_id },
      { type: "selector", dimension: "ctx_pdata_pid", value: "router" },
      { type: "selector", dimension: "error_code", value: null }
    ]
  },
  aggregations: [
    { type: "longSum", name: "count", fieldName: "count" }
  ]
});

export const generateTimeseriesQueryEventsPerHour = (intervals: string, dataset_id: string) => ({
  queryType: "timeseries",
  dataSource: "system-events",
  intervals: intervals,
  granularity: {
    type: "all",
    timeZone: "UTC"
  },
  filter: {
    type: "and",
    fields: [
      { type: "selector", dimension: "ctx_module", value: "processing" },
      { type: "selector", dimension: "ctx_dataset", value: dataset_id },
      { type: "selector", dimension: "ctx_pdata_pid", value: "router" },
      { type: "selector", dimension: "error_code", value: null }
    ]
  },
  aggregations: [
    { type: "longSum", name: "count", fieldName: "count" }
  ]
});

export const dataLineageSuccessQuery = (intervals: string, dataset_id: string, column: string, value: string) => ({
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
    type: "and",
    fields: [
      {
        type: "equals",
        column: column,
        matchValueType: "STRING",
        matchValue: value
      },
      {
        type: "equals",
        column: "ctx_dataset",
        matchValueType: "STRING",
        matchValue: dataset_id
      }
    ]
  },
  granularity: {
    type: "all",
    timeZone: "UTC"
  },
  aggregations: [
    {
      type: "longSum",
      name: "count",
      fieldName: "count"
    }
  ]
});

export const generateTransformationFailedQuery = (intervals: string, dataset_id: string) => ({
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
    matchValue: dataset_id
  },
  granularity: {
    type: "all",
    timeZone: "UTC"
  },
  aggregations: [
    {
      type: "filtered",
      aggregator: {
        type: "longSum",
        name: "count",
        fieldName: "count"
      },
      filter: {
        type: "and",
        fields: [
          {
            type: "equals",
            column: "ctx_pdata_id",
            matchValueType: "STRING",
            matchValue: "TransformerJob"
          },
          {
            type: "equals",
            column: "error_pdata_status",
            matchValueType: "STRING",
            matchValue: "failed"
          }
        ]
      },
      name: "count"
    }
  ]
});

export const generateDedupFailedQuery = (intervals: string, dataset_id: string) => ({
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
    matchValue: dataset_id
  },
  granularity: {
    type: "all",
    timeZone: "UTC"
  },
  aggregations: [
    {
      type: "filtered",
      aggregator: {
        type: "longSum",
        name: "count",
        fieldName: "count"
      },
      filter: {
        type: "and",
        fields: [
          {
            type: "equals",
            column: "ctx_pdata_pid",
            matchValueType: "STRING",
            matchValue: "dedup"
          },
          {
            type: "equals",
            column: "error_type",
            matchValueType: "STRING",
            matchValue: "DedupFailed"
          }
        ]
      },
      name: "count"
    }
  ]
});

export const generateDenormFailedQuery = (intervals: string, dataset_id: string) => ({
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
    matchValue: dataset_id
  },
  granularity: {
    type: "all",
    timeZone: "UTC"
  },
  aggregations: [
    {
      type: "filtered",
      aggregator: {
        type: "longSum",
        name: "count",
        fieldName: "count"
      },
      filter: {
        type: "and",
        fields: [
          {
            type: "equals",
            column: "ctx_pdata_pid",
            matchValueType: "STRING",
            matchValue: "denorm"
          },
          {
            type: "equals",
            column: "error_type",
            matchValueType: "STRING",
            matchValue: "DenormDataNotFound"
          }
        ]
      },
      name: "count"
    }
  ]
});

export const generateConnectorQuery = (intervals: string, dataset_id: string) => ({
  queryType: "topN",
  dataSource: {
    type: "table",
    name: "system-events"
  },
  dimension: {
    type: "default",
    dimension: "ctx_source_connector",
    outputName: "name",
    outputType: "STRING"
  },
  metric: {
    type: "dimension",
    ordering: {
      type: "lexicographic"
    }
  },
  threshold: 1001,
  intervals: {
    type: "intervals",
    intervals: [intervals]
  },
  filter: {
    type: "equals",
    column: "ctx_dataset",
    matchValueType: "STRING",
    matchValue: dataset_id
  },
  granularity: {
    type: "all",
    timeZone: "UTC"
  },
  aggregations: [
    {
      type: "longSum",
      name: "count",
      fieldName: "count"
    }
  ]
});

export const generateTotalQueryCallsQuery = (time_period: string) => ({
    end: dayjs().unix(),
    query: `sum(sum_over_time(node_total_api_calls{entity="data-out"}[${time_period}]))`,
    step: `${time_period}`,
    start: dayjs().subtract(1, 'day').unix()
});

export const generateDatasetQueryCallsQuery = (dataset: string, time_period: string) => ({
  end: dayjs().unix(),
  step: `${time_period}`,
  query: `sum(sum_over_time(node_total_api_calls{dataset_id="${dataset}",entity="data-out"}[${time_period}]))`,
  start: dayjs().subtract(1, 'day').unix(),
});