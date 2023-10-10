import { NextFunction, Response } from "express";
import { incrementApiCalls, incrementFailedApiCalls, incrementSuccessfulApiCalls, setQueryResponseTime } from ".";

export const onRequest = ({ entity }: any) => (req: any, res: Response, next: NextFunction) => {
    const { id, url } = req;
    const startTime = Date.now();
    req.startTime = startTime;
    req.entity = entity;
    incrementApiCalls({ entity, id, endpoint: url })
    next();
}

const getDuration = (startTime: number) => {
    const duration = startTime && (Date.now() - startTime);
    return duration || null
}

export const onSuccess = (req: any, res: Response) => {
    const { startTime, id, entity, url } = req;
    const duration = getDuration(startTime);
    duration && setQueryResponseTime(duration, { entity, id, endpoint: url });
    incrementSuccessfulApiCalls({ entity, id, endpoint: url })
}

export const onFailure = (req: any, res: Response) => {
    const { startTime, id, entity, url } = req;
    const duration = getDuration(startTime);
    duration && setQueryResponseTime(duration, { entity, id, endpoint: url });
    incrementFailedApiCalls({ entity, id, endpoint: url });
}
