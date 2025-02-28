import _ from "lodash";

import { grafanaHttpClient } from "../../../../../connections/grafanaConnection";
import constants from "../../../constants";
import { Notification } from "../../../../../models/Notification";

export const getRules = () => {
    return grafanaHttpClient.get("/api/ruler/grafana/api/v1/rules");
};

const getDatasource = () => {
    return grafanaHttpClient.get("api/datasources");
};

const alerts = () => {
    return grafanaHttpClient.get("/api/prometheus/grafana/api/v1/rules");
};

const deleteAlertRule = async (alertCategory: string) => {
    const folderUid = await getFolderUid(alertCategory)
    return grafanaHttpClient.delete(`/api/ruler/grafana/api/v1/rules/${folderUid}/${alertCategory}`);
};

const getFilteredAlerts = () => {
    return grafanaHttpClient.get("/api/alertmanager/grafana/api/v2/alerts?silenced&active&inhibited");
}

const deleteAlertFolder = async (folderName: string) => {
    const folderUID = await getFolderUid(folderName);
    if (!folderUID) throw new Error(constants.FOLDER_NOT_FOUND);
    return grafanaHttpClient.delete(`/api/folders/${folderUID}`)
};

const checkIfGroupNameExists = async (category: string) => {
    const response = await getRules();
    const rules = _.get(response, "data");
    if (!_.has(rules, category)) return undefined;
    return _.find(_.flatMap(_.values(rules)), {
        name: category,
    });
};

const checkIfRuleExists = (category: string | any, ruleName: string) => {
    const ruleExists = category.rules.some((rule: any) => rule.grafana_alert.title === ruleName);
    if (ruleExists) {
        throw new Error(constants.RULE_ALREADY_EXIST);
    }
};

const getPrometheusDataSource = async () => {
    const dataSources = await getDatasource();
    const prometheusDataSource = _.find(dataSources.data, { type: "prometheus" });
    if (!prometheusDataSource) {
        throw new Error(constants.PROMETHEUS_DATASOURCE_NOT_FOUND);
    }
    return prometheusDataSource;
};

const getSpecificRule = async (payload: Record<string, any>) => {
    const alertrules = await alerts();
    const groups = _.get(alertrules, "data.data.groups");
    const ruleGroup = _.find(groups, (group: any) => group.name == payload.category);
    return _.find(_.get(ruleGroup, "rules"), (rule: any) => rule.name == payload.name);
};

const updateMetadata = (metadata: any, dataSource: string, expression: string) => {
    const str = JSON.stringify(metadata);
    metadata = _.replace(_.replace(str, /\$datasourceUid/g, dataSource), /\$expr/g, expression);
    metadata = JSON.parse(metadata);
    return metadata;
};

const addGrafanaRule = async (payload: Record<string, any>) => {
    const folderUid = await getFolderUid(payload.name)
    return grafanaHttpClient.post(`/api/ruler/grafana/api/v1/rules/${folderUid}`, payload);
};

const getFolders = () => {
    return grafanaHttpClient.get("/api/folders")
};

const getFolderUid = async (name: string) => {
    const folders = await getFolders()
    const folderPayload = _.find(folders.data, (folder: any) => folder.title == name) || [];
    return folderPayload.uid;
}
const createFolder = (title: string) => {
    const payload = { title };
    return grafanaHttpClient.post("/api/folders", payload);
};

const createFolderIfNotExists = async (folderName: string) => {
    const folders = await getFolders();
    const isExists = _.find(folders.data, folder => _.get(folder, "title") === folderName);
    if (isExists) return;
    return createFolder(folderName);
}

const getQueryModel = (payload: Record<string, any>) => {
    const { metric, operator, threshold } = payload;
    const relativeTimeRange = { "from": 600, "to": 0 };

    return [
        {
            "refId": "A",
            "datasourceUid": "$datasourceUid",
            "queryType": "",
            "relativeTimeRange": relativeTimeRange,
            "model": {
                "refId": "A",
                "hide": false,
                "editorMode": "code",
                "expr": metric,
                "legendFormat": "__auto",
                "range": true
            }
        },
        {
            "refId": "B",
            "datasourceUid": "__expr__",
            "queryType": "",
            "model": {
                "refId": "B",
                "hide": false,
                "type": "reduce",
                "datasource": {
                    "uid": "__expr__",
                    "type": "__expr__"
                },
                "settings": {
                    "mode": "replaceNN",
                    "replaceWithValue": 0
                },
                "conditions": [
                    {
                        "type": "query",
                        "evaluator": {
                            "params": [],
                            "type": operator
                        },
                        "operator": {
                            "type": "and"
                        },
                        "query": {
                            "params": [
                                "B"
                            ]
                        },
                        "reducer": {
                            "params": [],
                            "type": "last"
                        }
                    }
                ],
                "reducer": "last",
                "expression": "A"
            },
            "relativeTimeRange": relativeTimeRange
        },
        {
            "refId": "C",
            "datasourceUid": "__expr__",
            "queryType": "",
            "model": {
                "refId": "C",
                "hide": false,
                "type": "threshold",
                "datasource": {
                    "uid": "__expr__",
                    "type": "__expr__"
                },
                "conditions": [
                    {
                        "type": "query",
                        "evaluator": {
                            "params": threshold,
                            "type": operator
                        },
                        "operator": {
                            "type": "and"
                        },
                        "query": {
                            "params": [
                                "C"
                            ]
                        },
                        "reducer": {
                            "params": [],
                            "type": "last"
                        }
                    }
                ],
                "expression": "B"
            },
            "relativeTimeRange": relativeTimeRange
        }
    ]
}

const queryOperators = [
    {
        label: "greater than (>)",
        value: "gt",
        symbol: ">"
    },
    {
        label: "less than (<)",
        value: "lt",
        symbol: "<"
    },
    {
        "label": "within range",
        "value": "within_range",
        "symbol": "within_range"
    }
];

const getQueryExpression = (payload: Record<string, any>) => {
    const { metric, operator, threshold } = payload;
    const operatorSymbol = _.get(_.find(queryOperators, operatorMetadata => _.get(operatorMetadata, "value") === operator), "symbol");
    return `(${metric}) ${operatorSymbol} ${threshold}`;
}

const getMatchingLabels = async (channels: string[]) => {
    try {

        const fetchChannel = (id: string) => {
            return Notification.findOne({ where: { id } })
                .then(response => response?.toJSON())
                .then(channelMetadata => {
                    const { name, type } = channelMetadata;
                    return `notificationChannel_${name}_${type}`;
                })
                .catch(() => null);
        }

        const matchingLabels = await Promise.all(channels.map(fetchChannel));
        return _.reduce(_.compact(matchingLabels), (acc, value) => {
            return { ...acc, [value]: "true" };
        }, {})

    } catch (error) {
        return {}
    }
}

const transformRule = async ({ value, condition, metadata, isGroup }: any) => {
    const { name, id, interval, category, frequency, labels = {}, annotations = {}, severity, description, notification = {} } = value;
    const annotationObj = { ...annotations, description: description };
    const channels = _.get(notification, "channels") || [];
    const matchingLabelsForNotification = await getMatchingLabels(channels);

    const payload = {
        grafana_alert: {
            title: name,
            condition: condition,
            no_data_state: _.get(metadata, "no_data_state", "NoData"),
            exec_err_state: _.get(metadata, "exec_err_state", "Error"),
            data: metadata,
            is_paused: false,
        },
        for: interval,
        annotations: annotationObj,
        labels: {
            "alertId": id,
            ...labels,
            ...(severity && { severity }),
            ...matchingLabelsForNotification
        }
    };

    if (isGroup) {
        return { name: category, interval: frequency, rules: [payload] };
    }

    return payload;
};


const groupRulesByCategory = (payload: Record<string, any>[]) => {
    return _.reduce(payload, (accumulator: Record<string, any>, current: Record<string, any>) => {
        const { category, name } = current;
        const existing = _.get(accumulator, category) || [];
        accumulator[category] = [...existing, name];
        return accumulator
    }, {});
}

export {
    getPrometheusDataSource,
    updateMetadata,
    checkIfGroupNameExists,
    checkIfRuleExists,
    transformRule,
    createFolderIfNotExists,
    addGrafanaRule,
    getSpecificRule,
    deleteAlertRule,
    deleteAlertFolder,
    getQueryExpression,
    getQueryModel,
    getFilteredAlerts,
    groupRulesByCategory
}