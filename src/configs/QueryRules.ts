export const queryRules = {
  "common": {
    "maxResultThreshold": 100,
    "maxResultRowLimit": 100
  },
  "rules": [
    {
      "dataSource": "telemetry-events",
      "queryRules": {
        "groupBy": {
          "maxDateRange": 30
        },
        "scan": {
          "maxDateRange": 30
        },
        "search": {
          "maxDateRange": 30
        },
        "timeBoundary": {
          "maxDateRange": 30
        },
        "timeSeries": {
          "maxDateRange": 30
        },
        "topN": {
          "maxDateRange": 30
        }
      }
    },
    {
      "dataSource": "summary-events",
      "queryRules": {
        "groupBy": {
          "maxDateRange": 30
        },
        "scan": {
          "maxDateRange": 30
        },
        "search": {
          "maxDateRange": 30
        },
        "timeBoundary": {
          "maxDateRange": 30
        },
        "timeSeries": {
          "maxDateRange": 30
        },
        "topN": {
          "maxDateRange": 30
        }
      }
    }
  ]
}
