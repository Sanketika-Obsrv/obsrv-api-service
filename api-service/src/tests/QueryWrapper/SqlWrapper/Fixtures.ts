export const TestInputsForSqlWrapper = {
    VALID_QUERY: {
        "query": "SELECT \"channel\",\"flags\", COUNT(*) AS \"Count\" FROM \"wikipedia\" WHERE \"page\" IS NOT NULL GROUP BY 1, 2 ORDER BY 3 DESC"
    },
    INVALID_QUERY: {
        "query": "SEL \"channel\",\"flags\", COUNT(*) AS \"Count\" FROM \"wikipedia\" WHERE \"page\" IS NOT NULL GROUP BY 1, 2 ORDER BY 3 DESC"
    },
    SUCCESS_REPONSE: {
        status: 200,
        data: [
            {
                "channel": "#en.wikipedia",
                "flags": "",
                "Count": 4776
            },
            {
                "channel": "#sh.wikipedia",
                "flags": "MB",
                "Count": 3964
            },
            {
                "channel": "#sv.wikipedia",
                "flags": "NB",
                "Count": 1003
            },
            {
                "channel": "#en.wikipedia",
                "flags": "M",
                "Count": 971
            },
        ]
    }
}