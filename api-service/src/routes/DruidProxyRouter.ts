import express from "express";
import { Entity } from "../types/MetricModel";
import { wrapperService } from "../services/WrapperService";
import { onRequest } from "../metrics/prometheus/helpers";
import { setDataToRequestObject } from "../middlewares/setDataToRequestObject";
import { healthService } from "../services/HealthService";
import { ResponseHandler } from "../helpers/ResponseHandler";

export const druidProxyRouter = express.Router();

// Send a 410 Gone response to all V1 API calls
druidProxyRouter.all(/\/datasets\/v1(.*)/, ResponseHandler.goneResponse);
druidProxyRouter.all(/\/dataset\/v1(.*)/, ResponseHandler.goneResponse);
druidProxyRouter.all(/\/datasources\/v1(.*)/, ResponseHandler.goneResponse);
druidProxyRouter.all(/\/data\/v1(.*)/, ResponseHandler.goneResponse);
druidProxyRouter.all(/\/template\/v1(.*)/, ResponseHandler.goneResponse);

// Druid Proxy APIs for Metabase integration
druidProxyRouter.post(/\/druid\/v2(.*)/, setDataToRequestObject("query.wrapper.native.post"), onRequest({ entity: Entity.DruidProxy }), wrapperService.forwardNative);
druidProxyRouter.get(/\/druid\/v2(.*)/, setDataToRequestObject("query.wrapper.native.get"), onRequest({ entity: Entity.DruidProxy }), wrapperService.forwardNativeGet);
druidProxyRouter.delete("/druid/v2/:queryId", setDataToRequestObject("query.wrapper.native.delete"), onRequest({ entity: Entity.DruidProxy }), wrapperService.forwardNativeDel)
druidProxyRouter.get("/status", setDataToRequestObject("query.wrapper.status"), onRequest({ entity: Entity.DruidProxy }), wrapperService.nativeStatus)
druidProxyRouter.get("/health", setDataToRequestObject("api.health"), onRequest({ entity: Entity.DruidProxy }), healthService.checkDruidHealth)
druidProxyRouter.get(/\/druid\/coordinator(.*)/, setDataToRequestObject("query.wrapper.native.get"), onRequest({entity: Entity.DruidProxy}), wrapperService.forwardNativeGetDatasource)