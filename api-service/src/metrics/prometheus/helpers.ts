import { NextFunction, Response } from "express";
import { incrementApiCalls, incrementFailedApiCalls, incrementSuccessfulApiCalls, setQueryResponseTime } from ".";
import _ from "lodash";
import { Entity, Metric } from "../../types/MetricModel";

export const onRequest = ({ entity = Entity.Management }: any) => (req: any, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    req.startTime = startTime;
    req.entity = entity;
    next();
}

const getDuration = (startTime: number) => {
    const duration = startTime && (Date.now() - startTime);
    return duration
}

export const onSuccess = (req: any, res: Response) => {
    const { duration = 0, metricLabels }: Metric = getMetricLabels(req, res)
    const { statusCode = 200 } = res
    const labels = { ...metricLabels, status: statusCode }
    duration && setQueryResponseTime({ duration, labels });
    incrementApiCalls({ labels })
    incrementSuccessfulApiCalls({ labels })
}

export const onFailure = (req: any, res: Response) => {
    const { duration = 0, metricLabels }: Metric = getMetricLabels(req, res)
    const { statusCode = 500 } = res
    const labels = { ...metricLabels, status: statusCode }
    duration && setQueryResponseTime({ duration, labels });
    incrementApiCalls({ labels })
    incrementFailedApiCalls({ labels });
}

const getMetricLabels = (req: any, res: Response) => {
    const { id, entity, url, startTime } = req;
    const { statusCode = 200 } = res
    const request_size = req.socket.bytesRead
    const response_size = res.getHeader('content-length');
    const dataset_id = _.get(req, "dataset_id") || null
    const duration = getDuration(startTime);
    const metricLabels = { entity, id, endpoint: url, dataset_id, status: statusCode, request_size, response_size }
    return { duration, metricLabels }
}
