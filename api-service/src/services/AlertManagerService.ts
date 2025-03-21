import _ from 'lodash';
import { obsrvError } from '../types/ObsrvError';
import { Metrics } from '../models/Metric';
import { deleteAlertRule, getAlertPayload, getAlertRule, publishAlert } from './managers';
import { Alert } from '../models/Alert';
import { Config } from './ConfigSevice';


class AlertManagerService {
    private config: any;

    constructor() {
        this.config = Config.getInstance().find('configs.alerts');
    }

    private getModifiedMetric(service: string, metric: any, datasetId: string): any {
        const metricData = _.cloneDeep(metric);
        if (service === 'flink') {
            const modifiedSubstring = datasetId.replace(/-/g, '_');
            metricData.metric = metricData.metric.replace('dataset_id', modifiedSubstring);
        } else {
            metricData.metric = metricData.metric.replace('dataset_id', datasetId);
        }
        return metricData;
    }

    private async createAlerts(params: { datasetId: string; service: string; metric: any; datasetName: string }): Promise<void> {
        const { datasetId, service, metric, datasetName } = params;
        const metricData = this.getModifiedMetric(service, metric, datasetId);
        const promMetric = metricData.metric;
        const metricAlias = `${metricData.alias} (${datasetId})`;

        const metricPayload = {
            alias: metricAlias,
            component: 'datasets',
            subComponent: datasetName,
            metric: promMetric,
            context: {
                datasetId: datasetId,
            },
        };

        await this.createMetric(metricPayload);
        await this.createAlertRule({ datasetId, metricData });
    }

    private async createAlertRule(params: {
        datasetId: string;
        metricData: any;
    }): Promise<void> {
        const { datasetId, metricData } = params;
        const datasetName = datasetId.replace(/[-.]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        const alertPayload = {
            name: `${metricData.alias} (${datasetName})`,
            manager: 'grafana',
            description: metricData.description,
            category: 'datasets',
            frequency: metricData.frequency,
            interval: metricData.interval,
            context: { alertType: 'SYSTEM' },
            labels: { component: 'obsrv' },
            metadata: {
                queryBuilderContext: {
                    category: 'datasets',
                    subComponent: datasetName,
                    metric: metricData.metric,
                    operator: metricData.operator,
                    threshold: [+metricData.threshold],
                    metricAlias: metricData.alias,
                }
            },
            notification: { channels: [] }
        };

        const alertData = getAlertPayload(alertPayload);
        const response = await this.createAlert(alertData);
        if (response.dataValues.id) {
            await this.publishAlertRule(response.dataValues.id);
        } else {
            throw obsrvError('', 'ALER_RULE_CREATION_FAILURE', 'Failed to create alert rule', 'SERVER_ERROR', 500);
        }
    }

    private async publishAlertRule(alertId: string): Promise<void> {
        const ruleModel: Record<string, any> | null = await getAlertRule(alertId);
        if (!ruleModel) {
            throw obsrvError(alertId, 'ALERT_RULE_NOT_FOUND', `Alert rule with id ${alertId} not found`, 'NOT_FOUND', 404);
        }
        const rulePayload = ruleModel.toJSON();
        if (rulePayload.status == "live") {
            await deleteAlertRule(rulePayload, false);
        }
        await publishAlert(rulePayload);
    }

    private createMetric = async (payload: Record<string, any>) => {
        return Metrics.create(payload);
    }

    private createAlert = async (alertData: Record<string, any>) => {
        return Alert.create(alertData);
    }

    public createDatasetAlerts = async (dataset: any): Promise<void> => {
        for (const metric of this.config.dataset_metrics) {
            await this.createAlerts({
                datasetId: dataset.dataset_id,
                service: "flink",
                metric: metric,
                datasetName: dataset.name
            });
        }

        // if (dataset.type === 'master') {
        //     for (const metric of this.config.masterdata_metrics) {
        //         await this.createAlertMetric({
        //             datasetId: dataset.dataset_id,
        //             service: 'master',
        //             metric,
        //             datasetName: dataset.name,
        //             transaction
        //         });
        //     }
        // }
    }
}

export const alertService = new AlertManagerService();