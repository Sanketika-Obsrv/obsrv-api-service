const _ = require('lodash');

const { publishRule, deleteRule, deleteMetricAlias, sleep, createRule, createMetricAlias, transformRule, convertRulesToJSON, getAllRuleFiles, logError } = require('./helpers');

const delay = process.env.delay || 5000;
const alertSource = process.env.source || "system-rule-ingestor-job"

/**
 * @description Delete all the existing system alert rules. Also delete from the alerting manager
 *
 */
const cleanExistingSystemAlerts = () => {
    const payload = { data: { "filters": { "context.alertType": "SYSTEM", "context.alertSource": alertSource } } }
    return deleteRule(payload);
}

/**
 * @description Delete all the existing system rules metric aliases
 *
 */
const cleanExistingSystemAlias = () => {
    const payload = { data: { "filters": { "context.alertType": "SYSTEM", "context.alertSource": alertSource } } }
    return deleteMetricAlias(payload);
}

/**
 * @description Clean all existing system rules and metric alias
 */
const cleanup = async () => {
    return cleanExistingSystemAlias()
        .then(_ => cleanExistingSystemAlerts())
        .catch(logError)
}

/**
 * @description Create Alias -> Create Rule -> Publish Rule
 * @param {*} payload
 * @return {*} 
 */
const createAndPublishRule = async (payload) => {
    try {
        const ruleName = _.get(payload, 'rule.name')
        console.log("[CREATE-ALIAS]", ruleName);
        await createMetricAlias(payload).catch(logError);
        console.log("[CREATE-RULE]", ruleName);
        const response = await createRule(payload)
        console.log("[PUBLISH-RULE]", ruleName);
        await publishRule(response);
        return sleep(delay);
    } catch (error) {
        logError(error);
    }
}

const init = async () => {
    try {
        await cleanup();
        const alertRuleFiles = getAllRuleFiles();
        for (let file of alertRuleFiles) {
            const rulesMetadata = await convertRulesToJSON(file);
            const transformedRulesMetadata = _.flatten(_.map(rulesMetadata, transformRule));
            for (let rule of transformedRulesMetadata) {
                await createAndPublishRule(rule);
            }
        }
    } catch (error) {
        logError(error)
    }
}

init();