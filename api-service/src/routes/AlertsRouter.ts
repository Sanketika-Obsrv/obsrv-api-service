import express from "express";
import notificationHandler from "../controllers/NotificationChannel/Notification";
import { setDataToRequestObject } from "../middlewares/setDataToRequestObject";
import customAlertHandler from "../controllers/Alerts/Alerts";
import metricAliasHandler from "../controllers/Alerts/Metric";
import silenceHandler from "../controllers/Alerts/Silence";
import checkRBAC from "../middlewares/RBAC_middleware";
import { OperationType, telemetryAuditStart } from "../services/telemetry";
import telemetryActions from "../telemetry/telemetryActions";

export const alertsRouter = express.Router();

// Notifications

alertsRouter.post("/notifications/search", setDataToRequestObject("api.alert.notification.list"), checkRBAC.handler(), notificationHandler.listHandler);
alertsRouter.post("/notifications/create", setDataToRequestObject("api.alert.notification.create"), telemetryAuditStart({action: telemetryActions.createNotifications, operationType: OperationType.CREATE}), checkRBAC.handler(), notificationHandler.createHandler);
alertsRouter.get("/notifications/publish/:id", setDataToRequestObject("api.alert.notification.publish"), checkRBAC.handler(), notificationHandler.publishHandler);
alertsRouter.post("/notifications/test", setDataToRequestObject("api.alert.notification.test"), checkRBAC.handler(), notificationHandler.testNotifationChannelHandler);
alertsRouter.patch("/notifications/update/:id", setDataToRequestObject("api.alert.notification.update"), telemetryAuditStart({action: telemetryActions.updateNotifications, operationType: OperationType.UPDATE}), checkRBAC.handler(), notificationHandler.updateHandler);
alertsRouter.delete("/notifications/delete/:id", setDataToRequestObject("api.alert.notification.retire"), telemetryAuditStart({action: telemetryActions.deleteNotifications, operationType: OperationType.RETIRE}), checkRBAC.handler(), notificationHandler.retireHandler);
alertsRouter.get("/notifications/get/:id", setDataToRequestObject("api.alert.notification.get"), checkRBAC.handler(), notificationHandler.fetchHandler);

// alerts
alertsRouter.post("/create", setDataToRequestObject("api.alert.create"), checkRBAC.handler(),telemetryAuditStart({action: telemetryActions.alertCreate, operationType: OperationType.CREATE}), customAlertHandler.createAlertHandler);
alertsRouter.get("/publish/:alertId", setDataToRequestObject("api.alert.publish"), checkRBAC.handler(), telemetryAuditStart({action: telemetryActions.alertHandlerPublish, operationType: OperationType.GET}), customAlertHandler.publishAlertHandler);
alertsRouter.post(`/search`, setDataToRequestObject("api.alert.list"), checkRBAC.handler(), customAlertHandler.searchAlertHandler);
alertsRouter.get("/get/:alertId", setDataToRequestObject("api.alert.getAlertDetails"), telemetryAuditStart({action: telemetryActions.alertHandlerDetails, operationType: OperationType.CREATE}), checkRBAC.handler(), customAlertHandler.alertDetailsHandler);
alertsRouter.delete("/delete/:alertId", setDataToRequestObject("api.alert.delete"), telemetryAuditStart({action: telemetryActions.deleteAlertHandler, operationType: OperationType.RETIRE}), checkRBAC.handler(), customAlertHandler.deleteAlertHandler);
alertsRouter.delete("/delete", setDataToRequestObject("api.alert.delete"), checkRBAC.handler(), customAlertHandler.deleteSystemAlertsHandler);
alertsRouter.patch("/update/:alertId", setDataToRequestObject("api.alert.update"), telemetryAuditStart({action: telemetryActions.updateAlertHandler, operationType: OperationType.UPDATE}), checkRBAC.handler(), customAlertHandler.updateAlertHandler);

// metrics
alertsRouter.post("/metric/alias/create",setDataToRequestObject("api.metric.add"), telemetryAuditStart({action: telemetryActions.createMetricHandler, operationType: OperationType.CREATE}), checkRBAC.handler(), metricAliasHandler.createMetricHandler);
alertsRouter.post("/metric/alias/search", setDataToRequestObject("api.metric.list"), checkRBAC.handler(), metricAliasHandler.listMetricsHandler);
alertsRouter.patch("/metric/alias/update/:id", setDataToRequestObject("api.metric.update"), telemetryAuditStart({action: telemetryActions.updateMetricHandler, operationType: OperationType.UPDATE}), checkRBAC.handler(), metricAliasHandler.updateMetricHandler);
alertsRouter.delete("/metric/alias/delete/:id", setDataToRequestObject("api.metric.remove"), telemetryAuditStart({action: telemetryActions.deleteMetricHandler, operationType: OperationType.RETIRE}), checkRBAC.handler(), metricAliasHandler.deleteMetricHandler);
alertsRouter.delete("/metric/alias/delete", setDataToRequestObject("api.metric.remove"), telemetryAuditStart({action: telemetryActions.deleteMultipleMetricHandler, operationType: OperationType.RETIRE}), checkRBAC.handler(), metricAliasHandler.deleteMultipleMetricHandler);

// silence
alertsRouter.post("/silence/create",setDataToRequestObject("api.alert.silence.create"), checkRBAC.handler(), silenceHandler.createHandler);
alertsRouter.get("/silence/search",setDataToRequestObject("api.alert.silence.list"), checkRBAC.handler(), silenceHandler.listHandler);
alertsRouter.get("/silence/get/:id",setDataToRequestObject("api.alert.silence.get"), checkRBAC.handler(), silenceHandler.fetchHandler);
alertsRouter.patch("/silence/update/:id",setDataToRequestObject("api.alert.silence.edit"), checkRBAC.handler(), silenceHandler.updateHandler);
alertsRouter.delete("/silence/delete/:id",setDataToRequestObject("api.alert.silence.delete"), checkRBAC.handler(), silenceHandler.deleteHandler);