import _ from "lodash";
import { Request, Response, NextFunction } from "express";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { Metrics } from "../../models/Metric";
import httpStatus from "http-status";
import errorResponse from "http-errors";
import { updateTelemetryAuditEvent } from "../../services/telemetry";

const telemetryObject = { type: "metric", ver: "1.0.0" };

const createMetricHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { component } = req.body;
        const metricsBody = await Metrics.create({ ...(req.body), component: component });
        updateTelemetryAuditEvent({ request: req, object: { id: metricsBody?.dataValues?.id, ...telemetryObject } });
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { id: metricsBody.dataValues.id } });
    } catch (error: any) {
        let errorMessage = _.get(error, "message")
        if (_.get(error, "name") == "SequelizeUniqueConstraintError") {
            errorMessage = _.get(error, "parent.detail")
        }
        next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, { message: errorMessage })))
    }
}

const listMetricsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { limit, filters, offset } = _.get(req.body, "request") || {};
        const metricsPayload = await Metrics.findAll({ limit: limit, offset: offset, ...(filters && { where: filters }) });
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { metrics: metricsPayload, count: metricsPayload.length } });
    } catch (error) {
        const errorMessage = _.get(error, "message")
        next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, { message: errorMessage })))
    }
}

const updateMetricHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const toUpdatePayload = req.body;
        const { component } = toUpdatePayload;
        const isEmpty = _.isEmpty(toUpdatePayload);
        if (isEmpty) throw new Error("Failed to update record");
        const record = await Metrics.findOne({ where: { id } });
        if (!record) throw new Error(httpStatus[httpStatus.NOT_FOUND]);
        updateTelemetryAuditEvent({ request: req, object: { id, ...telemetryObject }, currentRecord: record })
        await Metrics.update({ ...toUpdatePayload, ...(component) && { component: _.toLower(component) } }, {
            where: { id }
        });
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { id } });
    } catch (error) {
        let errorMessage = _.get(error, "message")
        if (_.get(error, "name") == "SequelizeUniqueConstraintError") {
            errorMessage = _.get(error, "parent.detail")
        }
        next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, { message: errorMessage })))
    }
}

const deleteMetricHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const record = await Metrics.findOne({ where: { id } });
        if (!record) throw new Error(httpStatus[httpStatus.NOT_FOUND]);
        await record.destroy();
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { id } });
    } catch (error) {
        const errorMessage = _.get(error, "message")
        next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, { message: errorMessage })))
    }
}

const deleteMultipleMetricHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { filters } = req.body;
        if (!filters) throw new Error("Failed to update record");
        await Metrics.destroy({ where: filters });
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: {} });
    } catch (error) {
        const errorMessage = _.get(error, "message")
        next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, { message: errorMessage })))
    }
}

export default { createMetricHandler, listMetricsHandler, updateMetricHandler, deleteMetricHandler, deleteMultipleMetricHandler };