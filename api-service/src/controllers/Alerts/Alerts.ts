import { Request, Response, NextFunction } from "express";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { Alert } from "../../models/Alert";
import httpStatus from "http-status";
import errorResponse from "http-errors";
import { deleteAlertRule, getAlertPayload, getAlertRule, getAlertsMetadata, publishAlert, retireAlertSilence, deleteSystemRules } from "../../services/managers";
import _ from "lodash";

import { updateTelemetryAuditEvent } from "../../services/telemetry";

const telemetryObject = { type: "alert", ver: "1.0.0" };

const createAlertHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertPayload = getAlertPayload(_.get(req, "body"));
    const userID = (req as any)?.userID;
    _.set(alertPayload, "created_by", userID);
    _.set(alertPayload, "updated_by", userID);
    const response = await Alert.create(alertPayload);
    updateTelemetryAuditEvent({ request: req, object: { id: response?.dataValues?.id, ...telemetryObject } });
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { id: response.dataValues.id } });
  } catch (error: any) {
    let errorMessage = _.get(error, "message")
    if (_.get(error, "name") == "SequelizeUniqueConstraintError") {
      errorMessage = _.get(error, "parent.detail")
    }
    next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, { message: errorMessage })))
  }
}

const publishAlertHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertId = _.get(req, 'params.alertId');
    const ruleModel: Record<string, any> | null = await getAlertRule(alertId);
    if (!ruleModel) return next({ message: httpStatus[httpStatus.NOT_FOUND], statusCode: httpStatus.NOT_FOUND });
    const rulePayload = ruleModel.toJSON();
    const userID = (req as any)?.userID;
    _.set(rulePayload, "updated_by", userID);
    if (rulePayload.status == "live") {
      await deleteAlertRule(rulePayload, false);
    }
    await publishAlert(rulePayload);
    updateTelemetryAuditEvent({ request: req, currentRecord: rulePayload, object: { id: alertId, ...telemetryObject } });
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { id: alertId } });
  } catch (error: any) {
    console.log(error?.message)
    next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, (<Error>error).message)));
  }
};

const transformAlerts = async (alertModel: any) => {
  const alert = alertModel?.toJSON();
  const status = _.get(alert, "status");
  if (status !== "live") return alert;
  return getAlertsMetadata(alert);
}

const searchAlertHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, filters, offset, options = {} } = _.get(req, 'body.request', {});
    const alerts = await Alert.findAll({ limit: limit, offset: offset, ...(filters && { where: filters }), ...options });
    const alertRulesWithStatus = await Promise.all(_.map(alerts, transformAlerts));
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { alerts: alertRulesWithStatus, count: alerts.length } });
  } catch (error) {
    next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, (<Error>error).message)));
  }
};

const alertDetailsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { alertId } = req.params;
    const ruleModel: Record<string, any> | null = await getAlertRule(alertId);
    if (!ruleModel) {
      return next({ message: httpStatus[httpStatus.NOT_FOUND], statusCode: httpStatus.NOT_FOUND });
    }
    let rulePayload = ruleModel.toJSON();
    if (rulePayload.status == "live") {
      rulePayload = await getAlertsMetadata(rulePayload)
    }
    updateTelemetryAuditEvent({ request: req, currentRecord: rulePayload, object: { id: alertId, ...telemetryObject } });
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { alerts: rulePayload } });
  } catch (error) {
    next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, (<Error>error).message)));
  }
}

const deleteAlertHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { alertId } = req.params;
    const { hardDelete = "false" } = req.query
    const ruleModel = await getAlertRule(alertId);
    if (!ruleModel) {
      return next({ message: httpStatus[httpStatus.NOT_FOUND], statusCode: httpStatus.NOT_FOUND });
    }
    const rulePayload = ruleModel.toJSON();
    const userID = (req as any)?.userID || "SYSTEM";
    _.set(rulePayload, "updated_by", userID);
    await deleteAlertRule(rulePayload, hardDelete === "true");
    updateTelemetryAuditEvent({ request: req, currentRecord: rulePayload, object: { id: alertId, ...telemetryObject } });
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { id: alertId } });
  } catch (error) {
    next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, (<Error>error).message)));
  }
}

const updateAlertHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertId = _.get(req, 'params.alertId');
    const isEmpty = _.isEmpty(_.get(req, "body"));
    if (isEmpty) throw new Error("Failed to update record");
    const ruleModel = await getAlertRule(alertId);
    if (!ruleModel) { return next({ message: httpStatus[httpStatus.NOT_FOUND], statusCode: httpStatus.NOT_FOUND }) }
    const rulePayload = ruleModel.toJSON();
    const userID = (req as any)?.userID;
    if (rulePayload.status == "live") {
      _.set(rulePayload, "updated_by", userID);
      await deleteAlertRule(rulePayload, false);
      await retireAlertSilence(alertId);
    }
    const updatedPayload = getAlertPayload({ ..._.get(req, "body"), manager: rulePayload?.manager });
    await Alert.update({ ...updatedPayload, status: "draft", updated_by: userID }, { where: { id: alertId } });
    updateTelemetryAuditEvent({ request: req, currentRecord: rulePayload, object: { id: alertId, ...telemetryObject } });
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { id: alertId } });
  } catch (error: any) {
    let errorMessage = _.get(error, "message")
    if (_.get(error, "name") == "SequelizeUniqueConstraintError") {
      errorMessage = _.get(error, "parent.detail")
    }
    next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, { message: errorMessage })))
  }
}

const deleteSystemAlertsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = _.get(req, 'body', {});
    const { filters } = body;
    if (!filters) throw new Error("Failed to update record");
    await deleteSystemRules({ filters, manager: "grafana" });
    await Alert.destroy({ where: filters });
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: {} });
  } catch (error) {
    next(errorResponse((httpStatus.INTERNAL_SERVER_ERROR, (<Error>error).message)));
  }
}

export default {
  alertDetailsHandler,
  searchAlertHandler,
  publishAlertHandler,
  createAlertHandler,
  deleteAlertHandler,
  updateAlertHandler,
  deleteSystemAlertsHandler
}

