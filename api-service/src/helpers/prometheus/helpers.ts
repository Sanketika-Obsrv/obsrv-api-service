import { NextFunction, Response } from "express";
import { incrementApiCalls, incrementFailedApiCalls, incrementSuccessfulApiCalls, setQueryResponseTime } from ".";
import _ from "lodash";

export const onRequest = ({ entity, dataset_extraction_config }: any) => (req: any, res: Response, next: NextFunction) => {
    const { id, url } = req;
    console.log(`url- ${url}`)
    const startTime = Date.now();
    req.startTime = startTime;
    req.entity = entity;
    const params = dataset_extraction_config['params']
    if( params && req.params[params]) {
        req.datasetId = req.params[params];
    }
    const body = dataset_extraction_config['body']
    if( body && _.get(req.body, body)) {
        req.datasetId = _.get(req.body, body)
    }
    
    incrementApiCalls({ entity, id, endpoint: url, datasetId: req.datasetId || null })
    next();
}

const getDuration = (startTime: number) => {
    const duration = startTime && (Date.now() - startTime);
    return duration || null
}

export const onSuccess = (req: any, res: Response, status: number) => {
    const { startTime, id, entity, url, datasetId = null } = req;
    const duration = getDuration(startTime);
    duration && setQueryResponseTime(duration, { entity, id, endpoint: url, status, datasetId });
    incrementSuccessfulApiCalls({ entity, id, endpoint: url, status, datasetId })
}

export const onFailure = (req: any, res: Response, status: number) => {
    const { startTime, id, entity, url, datasetId = null } = req;
    const duration = getDuration(startTime);
    duration && setQueryResponseTime(duration, { entity, id, endpoint: url , status, datasetId});
    incrementFailedApiCalls({ entity, id, endpoint: url, status, datasetId });
}
