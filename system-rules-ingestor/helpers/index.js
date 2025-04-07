const _ = require('lodash');
const jsYaml = require('js-yaml');
const fs = require('fs');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;

axiosRetry(axios, { retries: 3 });

const datasetServiceUrl = process.env.datasetServiceUrl || "http://localhost:3000";
const folder = process.env.folder || './alerting';
const alertSource = process.env.source || "system-rule-ingestor-job"

const publishRule = (payload) => axios.get(`${datasetServiceUrl}/alerts/v1/publish/${_.get(payload, 'data.result.id')}`);

const deleteRule = (payload) => axios.delete(`${datasetServiceUrl}/alerts/v1/delete`, payload);

const deleteMetricAlias = (payload) => axios.delete(`${datasetServiceUrl}/alerts/v1/metric/alias/delete`, payload);

const sleep = (timer) => new Promise((resolve) => setTimeout(() => resolve(), timer));

const createRule = (payload) => {
    const { rule } = payload;
    return axios.post(`${datasetServiceUrl}/alerts/v1/create`, rule);
}

const createMetricAlias = (payload) => {
    const { metricAlias } = payload;
    return axios.post(`${datasetServiceUrl}/alerts/v1/metric/alias/create`, metricAlias);
}

const transformRule = (metadata) => {
    const { name, description, query, severity = "warning", operator, threshold, category, frequency, interval, labels = {}, annotations = {} } = metadata
    const defaultLabels = { component: 'obsrv', type: category, alertSource: alertSource }

    const rulePayload = {
        name, "manager": "grafana", description, category, interval, frequency, labels: { ...defaultLabels, ...labels }, annotations, severity,
        "metadata": {
            "queryBuilderContext": {
                "category": category,
                "metric": query,
                "operator": operator,
                "threshold": threshold,
                "metricAlias": name
            }
        },
        "context": { "alertType": "SYSTEM", "alertSource": alertSource },
        "notification": {}
    }

    const metricAliasPayload = {
        "alias": name,
        "component": category,
        "metric": query,
        "context": { "alertType": "SYSTEM", "alertSource": alertSource },
    }

    return {
        rule: rulePayload,
        metricAlias: metricAliasPayload
    }
}

const getAllRuleFiles = () => fs.readdirSync(folder);

const convertRulesToJSON = (fileName) => {
    const rulesFile = fs.readFileSync(`${folder}/${fileName}`, { encoding: 'utf-8' });
    const rulesInJSON = jsYaml.load(rulesFile);
    return rulesInJSON || [];
}

const logError = (error) => {
    console.log(_.get(error, 'response.data') || _.get(error, 'message'))
}

module.exports = {
    publishRule,
    deleteRule,
    deleteMetricAlias,
    sleep,
    createRule,
    createMetricAlias,
    transformRule,
    getAllRuleFiles,
    convertRulesToJSON,
    logError
}