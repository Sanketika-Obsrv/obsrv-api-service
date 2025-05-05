import _ from "lodash";
import { addGrafanaRule, checkIfGroupNameExists, checkIfRuleExists, createFolderIfNotExists, deleteAlertFolder, deleteAlertRule, getPrometheusDataSource, getQueryExpression, getQueryModel, getSpecificRule, transformRule, updateMetadata, getRules } from "./helpers";
import { Silence } from "../../../../models/Silence";
import constants from "../../constants";

const publishAlert = async (payload: Record<string, any>) => {
  let metaData = payload.metadata || [];
  const conditionRef: any = _.last(metaData.query);
  if (!conditionRef) throw new Error(constants.INVALID_QUERY);
  const prometheusDataSource = await getPrometheusDataSource();
  metaData = await updateMetadata(metaData, _.get(prometheusDataSource, "uid"), payload.expression);
  const categoryExists = await checkIfGroupNameExists(payload.category);
  let alertRulePayload;
  const transformPayload = { value: payload, condition: conditionRef.refId, metadata: metaData.query };
  if (categoryExists) {
    checkIfRuleExists(categoryExists, payload.name);
    const newRule = await transformRule({ ...transformPayload, isGroup: false });
    const transformRules = _.concat(categoryExists.rules, newRule);
    alertRulePayload = { ...categoryExists, rules: transformRules };
  } else {
    await createFolderIfNotExists(payload.category);
    alertRulePayload = await transformRule({ ...transformPayload, isGroup: true });
  }

  return addGrafanaRule(alertRulePayload, payload.category);
};

const getAlerts = async (payload: Record<string, any>) => {
  const context = payload?.context || {};
  const alertId = _.get(payload, "id");
  const { err, alertData } = await getSpecificRule(payload)
    .then(alertData => {
      if (!alertData) throw new Error()
      return { err: null, alertData }
    })
    .catch(err => ({ err: err?.message || "rule not found in alerting manager", alertData: null }));

  const silenceModel = await Silence.findOne({ where: { alert_id: alertId } });
  const silenceData = silenceModel?.toJSON();
  const silenceState: Record<string, any> = { state: "", silenceId: "" };

  if (silenceData) {
    const { end_time } = silenceData;
    const currentTime = new Date().getTime();
    const endTime = new Date(end_time).getTime();
    if (currentTime < endTime) {
      silenceState.state = "muted";
      silenceState["endTime"] = endTime;
    } else {
      silenceState.state = "unmuted";
    }
    silenceState.silenceId = silenceData.id;
  } else {
    silenceState.state = "unmuted";
  }

  return { ...payload, context: { ...context, err }, ...(alertData && { alertData }), silenceState };
};

const deleteAlert = async (payload: Record<string, any>) => {
  const { name, category } = payload;
  const alertCategory = await checkIfGroupNameExists(category);
  if (!alertCategory) throw new Error(constants.CATEGORY_NOT_EXIST);

  if (_.get(alertCategory, "rules.length") > 1) {
    const filteredRule = _.filter(alertCategory.rules, (rule) => _.get(rule, "grafana_alert.title") !== name) || [];
    const filteredGroup = { ...alertCategory, rules: filteredRule };
    return addGrafanaRule(filteredGroup, _.get(alertCategory, "name"));
  }

  await deleteAlertRule(category);
  return deleteAlertFolder(category);
}

const generateAlertPayload = (payload: Record<string, any>) => {
  if (!(_.get(payload, "metadata.queryBuilderContext"))) return payload;
  const { metadata } = payload;
  const { queryBuilderContext } = metadata;
  const expression = getQueryExpression(queryBuilderContext);
  const queryModel = getQueryModel(queryBuilderContext);
  const updatedMetadata = { ...metadata, query: queryModel }
  return { ...payload, expression, metadata: updatedMetadata }
}

const filterSystemRulesPredicate = (rule: Record<string, any>) => {
  const labels = _.get(rule, "labels") || {};
  const isSystemAlert = _.find(labels, (value, key) => (key === "alertSource" && value === "system-rule-ingestor-job"));
  if (!isSystemAlert) return true;
  return false;
}

const deleteSystemRules = async () => {
  const response = await getRules();
  const existingRules = _.cloneDeep(_.get(response, "data")) as Record<string, Record<string, any>[]>;
  for (const [category, evaluationGroups] of Object.entries(existingRules)) {
    const evaluationGroup = _.find(evaluationGroups, ["name", category]);
    if (!evaluationGroup) continue;
    const rules = _.get(evaluationGroup, "rules") || []
    const filteredRules = _.filter(rules, filterSystemRulesPredicate);
    try {
      if (_.isEmpty(filteredRules)) {
        await deleteAlertRule(category);
        await deleteAlertFolder(category);
      } else {
        const filteredGroup = { ...evaluationGroup, rules: filteredRules };
        await addGrafanaRule(filteredGroup, category);
      }
    } catch (err) {
      console.log(err)
    }
  }
}

export { publishAlert, generateAlertPayload, deleteAlert, getAlerts, deleteSystemRules }