const maxDateRange = process.env.max_date_range ? parseInt(process.env.max_date_range) : 30 // in days

export const queryRules = {
  "common": {
    "maxResultThreshold": process.env.max_query_threshold ? parseInt(process.env.max_query_threshold) : 5000,
    "maxResultRowLimit":  process.env.max_query_limit  ? parseInt(process.env.max_query_limit) : 5000
  },
  "rules": [
    {
      "dataset": "telemetry-events",
      "queryRules": {
        "groupBy": {
          "maxDateRange": maxDateRange
        },
        "scan": {
          "maxDateRange": maxDateRange
        },
        "search": {
          "maxDateRange": maxDateRange
        },
        "timeBoundary": {
          "maxDateRange": maxDateRange
        },
        "timeseries": {
          "maxDateRange": maxDateRange
        },
        "topN": {
          "maxDateRange": maxDateRange
        }
      }
    },
    {
      "dataset": "summary-events",
      "queryRules": {
        "groupBy": {
          "maxDateRange": maxDateRange
        },
        "scan": {
          "maxDateRange": maxDateRange
        },
        "search": {
          "maxDateRange": maxDateRange
        },
        "timeBoundary": {
          "maxDateRange": maxDateRange
        },
        "timeseries": {
          "maxDateRange": maxDateRange
        },
        "topN": {
          "maxDateRange": maxDateRange
        }
      }
    }
  ]
}