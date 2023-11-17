import client from 'prom-client';
import { queryResponseTimeMetric, totalApiCallsMetric, failedApiCallsMetric, successApiCallsMetric } from './metrics'
const metrics = [queryResponseTimeMetric, totalApiCallsMetric, failedApiCallsMetric, successApiCallsMetric];
import { NextFunction } from 'express';

const register = new client.Registry();

const configureRegistry = (register: client.Registry) => {
    register.setDefaultLabels({ release: 'monitoring' });
    metrics.map(metric => {
        register.registerMetric(metric);
    })
}


const incrementApiCalls = (labels: Record<string, any> = {}) => totalApiCallsMetric.labels(labels).inc();
const setQueryResponseTime = (duration: any, labels: Record<string, any> = {}) => queryResponseTimeMetric.labels(labels).set(duration);
const incrementFailedApiCalls = (labels: Record<string, any>) => failedApiCallsMetric.labels(labels).inc();
const incrementSuccessfulApiCalls = (labels: Record<string, any>) => successApiCallsMetric.labels(labels).inc();

//register the metrics
configureRegistry(register);

const metricsScrapeHandler = async (req: any, res: any, next: NextFunction) => {
    try {
        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics()
        res.status(200).send(metrics);
    } catch (error) {
        next(error)
    }
}

export { metricsScrapeHandler, incrementApiCalls, incrementFailedApiCalls, setQueryResponseTime, incrementSuccessfulApiCalls };

