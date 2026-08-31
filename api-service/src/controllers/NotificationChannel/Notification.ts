import { Request, Response, NextFunction } from "express";
import { Notification } from "../../models/Notification";
import httpStatus from "http-status";
import createError from "http-errors";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { publishNotificationChannel, testNotificationChannel, updateNotificationChannel } from "../../services/managers";
import _ from "lodash";
import { updateTelemetryAuditEvent } from "../../services/telemetry";

const telemetryObject = { type: "notificationChannel", ver: "1.0.0" };

const createHandler = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const body = _.get(request, "body");
        const userID = (request as any)?.userID;
        _.set(body, "created_by", userID);
        _.set(body, "updated_by", userID);
        const notificationBody = await Notification.create(body);
        updateTelemetryAuditEvent({ request, object: { id: notificationBody?.dataValues?.id, ...telemetryObject } });
        ResponseHandler.successResponse(request, response, { status: httpStatus.OK, data: { id: notificationBody.dataValues.id } })
    } catch (err) {
        const error = createError(httpStatus.INTERNAL_SERVER_ERROR, _.get(err, "message") || httpStatus[httpStatus.INTERNAL_SERVER_ERROR])
        next(error);
    }
}

const updateHandler = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const id = _.get(request, 'params.id');
        const updatedPayload = _.get(request, 'body');
        const notificationPayloadModel = await Notification.findOne({ where: { id } });
        const notificationPayload = notificationPayloadModel?.toJSON();
        if (!notificationPayload) return next({ message: httpStatus[httpStatus.NOT_FOUND], statusCode: httpStatus.NOT_FOUND });
        updateTelemetryAuditEvent({ request, object: { id, ...telemetryObject }, currentRecord: notificationPayload });
        if (_.get(notificationPayload, "status") === "live") {
            await updateNotificationChannel(notificationPayload);
        }
        const userID = (request as any)?.userID;
        _.set(updatedPayload, "updated_by", userID);
        await Notification.update({ ...updatedPayload, status: "draft" }, { where: { id } });
        ResponseHandler.successResponse(request, response, { status: httpStatus.OK, data: { id } });
    } catch (err) {
        const error = createError(httpStatus.INTERNAL_SERVER_ERROR, _.get(err, "message") || httpStatus[httpStatus.INTERNAL_SERVER_ERROR])
        next(error);
    }
}

const listHandler = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { limit, filters, offset } = _.get(request.body, 'request', {});
        const notifications = await Notification.findAll({ limit: limit, offset: offset, ...(filters && { where: filters }) });
        const count = _.get(notifications, "length");
        ResponseHandler.successResponse(request, response, { status: httpStatus.OK, data: { notifications, ...(count && { count }) } });
    } catch (err) {
        const error = createError(httpStatus.INTERNAL_SERVER_ERROR, _.get(err, "message") || httpStatus[httpStatus.INTERNAL_SERVER_ERROR])
        next(error);
    }
}

const fetchHandler = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const id = _.get(request, 'params.id');
        const notificationPayloadModel = await Notification.findOne({ where: { id } });
        const notificationPayload = notificationPayloadModel?.toJSON();
        if (!notificationPayloadModel) return next({ message: httpStatus[httpStatus.NOT_FOUND], statusCode: httpStatus.NOT_FOUND });
        updateTelemetryAuditEvent({ request, object: { id, ...telemetryObject }, currentRecord: notificationPayload });
        ResponseHandler.successResponse(request, response, { status: httpStatus.OK, data: notificationPayloadModel?.toJSON() });
    } catch (err) {
        const error = createError(httpStatus.INTERNAL_SERVER_ERROR, _.get(err, "message") || httpStatus[httpStatus.INTERNAL_SERVER_ERROR])
        next(error);
    }
}

const retireHandler = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const id = _.get(request, 'params.id');
        const notificationPayloadModel = await Notification.findOne({ where: { id } })
        const notificationPayload = notificationPayloadModel?.toJSON();
        if (!notificationPayload) return next({ message: httpStatus[httpStatus.NOT_FOUND], statusCode: httpStatus.NOT_FOUND });
        updateTelemetryAuditEvent({ request, object: { id, ...telemetryObject }, currentRecord: notificationPayload });
        await updateNotificationChannel(notificationPayload);
        const userID = (request as any)?.userID;
        await Notification.update({ status: "retired", updated_by: userID }, { where: { id } })
        ResponseHandler.successResponse(request, response, { status: httpStatus.OK, data: { id } });
    } catch (err) {
        const error = createError(httpStatus.INTERNAL_SERVER_ERROR, _.get(err, "message") || httpStatus[httpStatus.INTERNAL_SERVER_ERROR])
        next(error);
    }
}

const publishHandler = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const id = _.get(request, 'params.id');
        const notificationPayloadModel = await Notification.findOne({ where: { id } })
        const notificationPayload = notificationPayloadModel?.toJSON();
        if (!notificationPayload) return next({ message: httpStatus[httpStatus.NOT_FOUND], statusCode: httpStatus.NOT_FOUND });
        if (notificationPayload.status === "live") throw new Error(httpStatus[httpStatus.CONFLICT]);
        updateTelemetryAuditEvent({ request, object: { id, ...telemetryObject }, currentRecord: notificationPayload });
        await publishNotificationChannel(notificationPayload);
        const userID = (request as any)?.userID;
        Notification.update({ status: "live", updated_by: userID }, { where: { id } });
        ResponseHandler.successResponse(request, response, { status: httpStatus.OK, data: { id, status: "published" } });
    } catch (err) {
        const error = createError(httpStatus.INTERNAL_SERVER_ERROR, _.get(err, "message") || httpStatus[httpStatus.INTERNAL_SERVER_ERROR])
        next(error);
    }
}

const testNotifationChannelHandler = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { message = "Hello Obsrv", payload = {} } = _.get(request, 'body');
        const { id } = payload;
        if (id) {
            const notificationPayloadModel = await Notification.findOne({ where: { id } })
            const notificationPayload = notificationPayloadModel?.toJSON();
            if (!notificationPayload) return next({ message: httpStatus[httpStatus.NOT_FOUND], statusCode: httpStatus.NOT_FOUND });
            await testNotificationChannel({ ...notificationPayload, message });
        }
        else {
            await testNotificationChannel({ ...payload, message })
        }
        ResponseHandler.successResponse(request, response, { status: httpStatus.OK, data: { id, status: "Notification Sent" } });
    } catch (err) {
        const error = createError(httpStatus.INTERNAL_SERVER_ERROR, _.get(err, "message") || httpStatus[httpStatus.INTERNAL_SERVER_ERROR])
        next(error);
    }
}

export default { listHandler, createHandler, publishHandler, updateHandler, retireHandler, fetchHandler, testNotifationChannelHandler }