import { Request, Response, NextFunction } from "express";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { createSilence, deleteSilence, getSilenceMetaData, updateSilence } from "../../services/managers";
import httpStatus from "http-status";
import errorResponse from "http-errors";
import _ from "lodash";
import { Silence } from "../../models/Silence";
import { updateTelemetryAuditEvent } from "../../services/telemetry";

const telemetryObject = { type: "alert-silence", ver: "1.0.0" };

const createHandler = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const payload = _.get(request,'body');
        const { startDate, endDate, alertId } = payload;
        const existingSilence = await Silence.findOne({ where: { alert_id: alertId } });
        if (existingSilence) existingSilence.destroy();
        const grafanaResponse = await createSilence(payload);
        if (!grafanaResponse) return next({ message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR], statusCode: httpStatus.INTERNAL_SERVER_ERROR })

        const start_date = new Date(startDate);
        const end_date = new Date(endDate);
        const userID = (request as any)?.userID;
        const silenceBody = {
            id: grafanaResponse.silenceId,
            manager: grafanaResponse.manager,
            alert_id: alertId,
            start_time: start_date,
            end_time: end_date,
            created_by : userID,
            updated_by : userID,
        }
        const sileneResponse = await Silence.create(silenceBody);
        updateTelemetryAuditEvent({ request, object: { id: sileneResponse?.dataValues?.id, ...telemetryObject } });
        ResponseHandler.successResponse(request, response, { status: httpStatus.OK, data: { id: sileneResponse.dataValues.id } })
    } catch (err) {
        const error = errorResponse(httpStatus.INTERNAL_SERVER_ERROR, _.get(err, "message") || httpStatus[httpStatus.INTERNAL_SERVER_ERROR])
        next(error);
    }
}

const transformSilences = async (silenceModel: any) => {
    const silence = silenceModel?.toJSON();
    return getSilenceMetaData(silence);
}


const listHandler = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const silences = await Silence.findAll();
        const count = _.get(silences, "length");
        const transformedSilences = await Promise.all(silences.map(transformSilences));
        ResponseHandler.successResponse(request, response, { status: httpStatus.OK, data: { transformedSilences, ...(count && { count }) } });
    } catch (err) {
        const error = errorResponse(httpStatus.INTERNAL_SERVER_ERROR, _.get(err, "message") || httpStatus[httpStatus.INTERNAL_SERVER_ERROR])
        next(error);
    }
}

const fetchHandler = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const id = _.get(request,'params.id');
        const silenceModel = await Silence.findOne({ where: { id } });
        const transformedSilence = await transformSilences(silenceModel);
        if (!silenceModel) return next({ message: httpStatus[httpStatus.NOT_FOUND], statusCode: httpStatus.NOT_FOUND });
        ResponseHandler.successResponse(request, response, { status: httpStatus.OK, data: transformedSilence });
    } catch (err) {
        const error = errorResponse(httpStatus.INTERNAL_SERVER_ERROR, _.get(err, "message") || httpStatus[httpStatus.INTERNAL_SERVER_ERROR])
        next(error);
    }
}

const updateHandler = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const id = _.get(request,'params.id');
        const payload = _.get(request, 'body');
        const silenceModel = await Silence.findOne({ where: { id } });
        if (!silenceModel) return next({ message: httpStatus[httpStatus.NOT_FOUND], statusCode: httpStatus.NOT_FOUND });
        const silenceObject = silenceModel?.toJSON();
        updateTelemetryAuditEvent({ request, object: { id, ...telemetryObject }, currentRecord: silenceObject });
        await updateSilence(silenceObject, payload);
        const updatedStartTime = new Date(payload.startTime);
        const updatedEndTime = new Date(payload.endTime);
        const userID = (request as any)?.userID;
        const updatedSilence = {
            ...silenceObject,
            start_time: updatedStartTime,
            end_time: updatedEndTime,
            updated_by: userID,
        }
        const silenceResponse = await Silence.update(updatedSilence, { where: { id } })
        ResponseHandler.successResponse(request, response, { status: httpStatus.OK, data: { silenceResponse } })
    } catch (err) {
        const error = errorResponse(httpStatus.INTERNAL_SERVER_ERROR, _.get(err, "message") || httpStatus[httpStatus.INTERNAL_SERVER_ERROR])
        next(error);
    }
}

const deleteHandler = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const id = _.get(request,'params.id');
        const silenceModel = await Silence.findOne({ where: { id } });
        if (!silenceModel) return next({ message: httpStatus[httpStatus.NOT_FOUND], statusCode: httpStatus.NOT_FOUND });
        const silenceObject = silenceModel?.toJSON();
        if (silenceObject?.status === "expired") return next({ message: "Silence is already expired", statusCode: httpStatus.BAD_REQUEST });
        await deleteSilence(silenceObject);
        await silenceModel.destroy();
        updateTelemetryAuditEvent({ request, object: { id, ...telemetryObject }, currentRecord: silenceObject });
        ResponseHandler.successResponse(request, response, { status: httpStatus.OK, data: { id } })
    } catch (err) {
        const error = errorResponse(httpStatus.INTERNAL_SERVER_ERROR, _.get(err, "message") || httpStatus[httpStatus.INTERNAL_SERVER_ERROR])
        next(error);
    }
}

export default {
    createHandler,
    listHandler,
    fetchHandler,
    updateHandler,
    deleteHandler
}