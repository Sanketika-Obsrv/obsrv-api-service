import _ from 'lodash';
import { obsrvError } from '../types/ObsrvError';
import { Metrics } from '../models/Metric';
import { getAlertByDataset, getAlertPayload, getAlertRule, publishAlert } from './managers';
import { Alert } from '../models/Alert';
import { alertConfig } from './AlertsConfigSevice';
import Transaction from "sequelize/types/transaction";


class AlertManagerService {
    private config: any;

    constructor() {
        this.config = alertConfig.find('configs.alerts');
    }

    private getModifiedMetric = (service: string, metric: any, datasetId: string): any => {
        const metricData = _.cloneDeep(metric);
        if (service === 'flink') {
            const modifiedSubstring = datasetId.replace(/-/g, '_');
            metricData.metric = metricData.metric.replaceAll('dataset_id', modifiedSubstring);
        }
        else {
            metricData.metric = metricData.metric.replace('dataset_id', datasetId);
        }
        return metricData;
    }

    private createAlerts = async (params: { datasetId: string; service: string; metric: any; transaction: Transaction }): Promise<void> => {
        const { datasetId, service, metric, transaction } = params;
        const metricData = this.getModifiedMetric(service, metric, datasetId);

        const metricPayload = {
            alias: `${metricData.alias} (${datasetId})`,
            component: metricData.category,
            subComponent: datasetId,
            metric: metricData.metric,
            context: {
                datasetId: datasetId,
            },
        };

        const response = await this.createMetric(metricPayload, transaction);
        await this.createAlertRule({ datasetId, metricData, transaction, metricId: response.dataValues.id });
    }

    private createAlertRule = async (params: {
        datasetId: string;
        metricData: any;
        transaction: Transaction;
        metricId: string;
    }): Promise<void> => {
        const { datasetId, metricData, transaction, metricId } = params;
        const datasetName = datasetId.replace(/[-.]/g, ' ').replace(/\b\w/g, c => _.toUpper(c));
        const alertPayload = {
            name: `${metricData.alias} (${datasetName})`,
            manager: 'grafana',
            description: metricData.description,
            category: metricData.category,
            frequency: metricData.frequency,
            interval: metricData.interval,
            context: { alertType: 'SYSTEM' },
            labels: { alert_code: metricData.code, component: 'obsrv', dataset: datasetId },
            severity: metricData.severity,
            metadata: {
                queryBuilderContext: {
                    category: metricData.category,
                    id: metricId,
                    subComponent: datasetId,
                    metric: metricData.metric,
                    operator: metricData.operator,
                    threshold: [+metricData.threshold],
                    metricAlias: metricData.alias,
                }
            },
            notification: { channels: [] }
        };

        const alertData = getAlertPayload(alertPayload);
        await this.createAlert(alertData, transaction);
    }

    public publishAlertRule = async (dataset_id: string): Promise<void> => {
        const datasetAlerts: any[] = await getAlertByDataset(dataset_id)
        for (const alert of datasetAlerts) {
            const { id } = alert;
            const ruleModel: Record<string, any> | null = await getAlertRule(id);
            if (!ruleModel) {
                throw obsrvError(id, 'ALERT_RULE_NOT_FOUND', `Alert rule with id ${id} not found`, 'NOT_FOUND', 404);
            }
            const rulePayload = ruleModel.toJSON();
            await publishAlert(rulePayload);
        }
    }

    private createMetric = async (payload: Record<string, any>, transaction: Transaction) => {
        return Metrics.create(payload, { transaction });
    }

    private createAlert = async (alertData: Record<string, any>, transaction: Transaction) => {
        return Alert.create(alertData, { transaction });
    }

    public createDatasetAlertsDraft = async (dataset: Record<string, any>, transaction: Transaction): Promise<void> => {
        for (const metric of this.config.dataset_metrics_flink) {
            await this.createAlerts({
                datasetId: dataset.dataset_id,
                service: "flink",
                metric: metric,
                transaction
            });
        }
    }
}

export const alertService = new AlertManagerService();