import _ from "lodash";
import { Alert } from "../../models/Alert";
import grafanaService from "./grafana/index";
import prometheusService from "./prometheus/index";
import { Silence } from "../../models/Silence";
import { Metrics } from "../../models/Metric";
import constants from "./constants";

export const getAlertRule = (id: string) => {
  return Alert.findOne({ where: { id } });
}

const getService = (manager: string) => {
  switch (manager) {
    case "grafana": {
      return grafanaService;
    }
    case "prometheus": {
      return prometheusService;
    }
    default:
      throw new Error("Invalid Alert manager");
  }
};

export const publishAlert = async (payload: Record<string, any>) => {
  const { id, manager, updated_by } = payload;
  const service = getService(manager);
  const publishResponse = await service.publishAlert(payload)
  await updateStatus(id, "live", updated_by);
  return publishResponse;
};


const updateStatus = (id: string, status: string, updated_by: string) => {
  return Alert.update({ status, updated_by }, { where: { id } });
}

const deleteRule = (id: string) => {
  return Alert.destroy({ where: { id } })
}

export const deleteAlertRule = async (payload: Record<string, any>, hardDelete: boolean) => {
  const { id, manager, status, updated_by } = payload;

  if (status == "live") {
    try {
      const service = getService(manager);
      await service.deleteAlert(payload)
    } catch (err: any) {
      console.log(err)
    }
  }

  if (hardDelete) {
    return deleteRule(id);
  }

  return updateStatus(id, "retired", updated_by);
}


export const deleteSystemRules = async (payload: Record<string, any>) => {
  const { manager } = payload;
  const service = getService(manager);
  return service.deleteSystemRules();
}

export const getAlertsMetadata = (payload: Record<string, any>) => {
  const { manager } = payload;
  const service = getService(manager);
  return service.getAlerts(payload);
}

export const getAlertPayload = (payload: Record<string, any>) => {
  const { manager } = payload;
  const service = getService(manager);
  return service.generateAlertPayload(payload);
}

export const publishNotificationChannel = async (payload: Record<string, any>) => {
  const { manager } = payload;
  const service = getService(manager);
  return service.createNotificationChannel(payload);
}

export const testNotificationChannel = async (payload: Record<string, any>) => {
  const { manager } = payload;
  const service = getService(manager);
  return service.testNotificationChannel(payload);
}

export const updateNotificationChannel = async (payload: Record<string, any>) => {
  const { manager } = payload;
  const service = getService(manager);
  return service.updateNotificationChannel(payload);
}

export const createSilence = async (payload: Record<string, any>) => {
  const { manager } = payload;
  const service = getService(manager);
  return service.createSilence(payload);
}

export const getSilenceMetaData = async (payload: Record<string, any>) => {
  const { manager } = payload;
  const service = getService(manager);
  return service.getSilenceMetadata(payload);
}

export const updateSilence = async (silence: Record<string, any>, payload: Record<string, any>) => {
  const { manager } = silence;
  const service = getService(manager);
  await service.updateSilence(silence, payload);
}

export const deleteSilence = async (payload: Record<string, any>) => {
  const { id, manager } = payload;
  const service = getService(manager);
  await service.deleteSilence(id);
}

export const deleteAlertByDataset = async (payload: Record<string, any>) => {
  try {
    const { dataset_id } = payload;
    const alertRulePayload = await Alert.findAll({ where: { category: "datasets", "metadata.queryBuilderContext.subComponent": dataset_id }, raw: true })
    if (!alertRulePayload) throw new Error(constants.ALERTS_NOT_FOUND)
    for (const payload of alertRulePayload) {
      await deleteAlertRule(payload, true)
      await retireAlertSilence(_.get(payload, "id") || "")
    }
    return constants.ALERTS_RETIRED_SUCCESSFULLY;
  } catch (error: any) {
    throw new Error(constants.ALERTS_NOT_RETIRED);
  }
}

export const deleteMetricAliasByDataset = async (payload: Record<string, any>) => {
  try {
    const { dataset_id } = payload;
    await Metrics.destroy({ where: { component: "datasets", subComponent: dataset_id } })
    return constants.METRIC_ALIAS_DELETED_SUCCESSFULLY;
  } catch (error: any) {
    throw new Error(constants.METRIC_ALIAS_NOT_DELETED);
  }
}

export const getAlertByDataset = async (dataset_id: string) => {
  try {
    const alertRulePayload = await Alert.findAll({ where: { category: "datasets", "metadata.queryBuilderContext.subComponent": dataset_id }, raw: true })
    if (!alertRulePayload) throw new Error(constants.ALERTS_NOT_FOUND)
    return alertRulePayload;
  } catch (error) {
    throw new Error(constants.ALERTS_FETCH_FAILURE);
  }
}

export const getAlertMetricsByDataset = async (payload: Record<string, any>) => {
  try {
    const { dataset_id } = payload;
    const metricAliasPayload = await Metrics.findAll({ where: { component: "datasets", subComponent: dataset_id }, raw: true })
    if (!metricAliasPayload) throw new Error(constants.METRIC_ALIAS_NOT_FOUND)
    return metricAliasPayload;
  } catch (error: any) {
    throw new Error(constants.METRIC_ALIAS_NOT_DELETED);
  }
}

export const createAlertsByDataset = async (payload: any) => {
  try {
    for (const alerts of payload) {
      const alertPayload = _.omit(alerts as any, ["id", "status", "createdAt", "updatedAt", "created_by", "updated_by"])
      await Alert.create(alertPayload)
    }
  } catch (error) {
    throw new Error(constants.ALERT_CREATE_FAILURE);
  }
}

export const createMetricAliasByDataset = async (payload: any) => {
  try {
    for (const metrics of payload) {
      const metricsPayload = _.omit(metrics as any, ["id", "createdAt", "updatedAt"])
      await Metrics.create(metricsPayload)
    }
  } catch (error) {
    throw new Error(constants.METRIC_ALIAS_CREATE_FAILURE);
  }
}

export const publishAlertByDataset = async (payload: Record<string, any>) => {
  try {
    const { name } = payload;
    const alertRulePayload = await Alert.findAll({ where: { category: "datasets", "metadata.queryBuilderContext.subComponent": name }, raw: true })
    if (!alertRulePayload) throw new Error("Alert rule does not exist")
    for (const payload of alertRulePayload) {
      await publishAlert(payload)
    }
    return constants.ALERTS_PUBLISHED_SUCCESSFULLY;
  } catch (error: any) {
    throw new Error(constants.ALERT_PUBLISH_FAILURE);
  }
}

export const retireAlertSilence = async (alert_id: string) => {
  const silencePayload = await Silence.findOne({ where: { alert_id }, raw: true });
  if (silencePayload) {
    await deleteSilence(silencePayload);
    await Silence.destroy({ where: { alert_id } });
  }
  return constants.SILENCE_DELETED_SUCCESSFULLY;
}