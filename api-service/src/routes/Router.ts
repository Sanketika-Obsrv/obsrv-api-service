import express from "express";
import dataIn from "../controllers/DataIngestion/DataIngestionController";
import DatasetCreate from "../controllers/DatasetCreate/DatasetCreate";
import dataOut from "../controllers/DataOut/DataOutController";
import DatasetUpdate from "../controllers/DatasetUpdate/DatasetUpdate";
import DatasetRead from "../controllers/DatasetRead/DatasetRead";
import DatasetList from "../controllers/DatasetList/DatasetList"
import { dataExhaust } from "../controllers/DataExhaust/DataExhaustController";
import { onRequest } from "../metrics/prometheus/helpers";
import { Entity } from "../types/MetricModel";
import { createQueryTemplate } from "../controllers/CreateQueryTemplate/CreateTemplateController";
import { setDataToRequestObject } from "../middlewares/setDataToRequestObject";
import { readQueryTemplate } from "../controllers/ReadQueryTemplate/ReadTemplateController";
import { deleteQueryTemplate } from "../controllers/DeleteQueryTemplate/DeleteTemplateController";
import { listQueryTemplates } from "../controllers/ListQueryTemplates/ListTemplatesController";
import { queryTemplate } from "../controllers/QueryTemplate/QueryTemplateController";
import { updateQueryTemplate } from "../controllers/UpdateQueryTemplate/UpdateTemplateController";
import { eventValidation } from "../controllers/EventValidation/EventValidation";
import GenerateSignedURL from "../controllers/GenerateSignedURL/GenerateSignedURL";
import { sqlQuery } from "../controllers/QueryWrapper/SqlQueryWrapper";
import DatasetStatusTansition from "../controllers/DatasetStatusTransition/DatasetStatusTransition";
import datasetHealth from "../controllers/DatasetHealth/DatasetHealth";
import DataSchemaGenerator from "../controllers/GenerateDataSchema/GenerateDataSchema";
import datasetReset from "../controllers/DatasetReset/DatasetReset";
import DatasetExport from "../controllers/DatasetExport/DatasetExport";
import DatasetCopy from "../controllers/DatasetCopy/DatasetCopy";
import ConnectorsList from "../controllers/ConnectorsList/ConnectorsList";
import ConnectorsRead from "../controllers/ConnectorsRead/ConnectorsRead";
import DatasetImport from "../controllers/DatasetImport/DatasetImport";
import { OperationType, telemetryAuditStart } from "../services/telemetry";
import telemetryActions from "../telemetry/telemetryActions";
import datasetMetrics from "../controllers/DatasetMetrics/DatasetMetricsController";
import checkRBAC from "../middlewares/RBAC_middleware";
import connectorRegisterController from "../controllers/ConnectorRegister/ConnectorRegisterController";

export const router = express.Router();

router.post("/data/in/:datasetId", setDataToRequestObject("api.data.in"), onRequest({ entity: Entity.Data_in }), telemetryAuditStart({action: telemetryActions.createDataset, operationType: OperationType.CREATE}), checkRBAC.handler(), dataIn);
router.post("/data/query/:datasetId", setDataToRequestObject("api.data.out"), onRequest({ entity: Entity.Data_out }), checkRBAC.handler(), dataOut);
router.post("/datasets/create", setDataToRequestObject("api.datasets.create"), onRequest({ entity: Entity.Management }),telemetryAuditStart({action: telemetryActions.createDataset, operationType: OperationType.CREATE}), checkRBAC.handler(),DatasetCreate)
router.patch("/datasets/update", setDataToRequestObject("api.datasets.update"), onRequest({ entity: Entity.Management }),telemetryAuditStart({action: telemetryActions.updateDataset, operationType: OperationType.UPDATE}), checkRBAC.handler(), DatasetUpdate)
router.get("/datasets/read/:dataset_id", setDataToRequestObject("api.datasets.read"), onRequest({ entity: Entity.Management }), telemetryAuditStart({action: telemetryActions.readDataset, operationType: OperationType.GET}), checkRBAC.handler(), DatasetRead)
router.post("/datasets/list", setDataToRequestObject("api.datasets.list"), onRequest({ entity: Entity.Management }), telemetryAuditStart({action: telemetryActions.listDatasets, operationType: OperationType.LIST}), checkRBAC.handler(), DatasetList)
router.get("/data/exhaust/:datasetId", setDataToRequestObject("api.data.exhaust"), onRequest({ entity: Entity.Management }), telemetryAuditStart({action: telemetryActions.datasetExhaust, operationType: OperationType.GET}), checkRBAC.handler(), dataExhaust);
router.post("/template/create", setDataToRequestObject("api.query.template.create"), checkRBAC.handler(), createQueryTemplate);
router.get("/template/read/:templateId", setDataToRequestObject("api.query.template.read"), checkRBAC.handler(), readQueryTemplate);
router.delete("/template/delete/:templateId", setDataToRequestObject("api.query.template.delete"), checkRBAC.handler(), deleteQueryTemplate);
router.post("/template/list", setDataToRequestObject("api.query.template.list"), checkRBAC.handler(), listQueryTemplates);
router.patch("/template/update/:templateId", setDataToRequestObject("api.query.template.update"), checkRBAC.handler(), updateQueryTemplate);
router.post("/schema/validate", setDataToRequestObject("api.schema.validator"), checkRBAC.handler(), eventValidation); 
router.post("/template/query/:templateId", setDataToRequestObject("api.query.template.query"), checkRBAC.handler(), queryTemplate);
router.post("/files/generate-url", setDataToRequestObject("api.files.generate-url"), onRequest({ entity: Entity.Management }), checkRBAC.handler(), GenerateSignedURL);
router.post("/datasets/status-transition", setDataToRequestObject("api.datasets.status-transition"), onRequest({ entity: Entity.Management }), telemetryAuditStart({action: telemetryActions.createTransformation, operationType: OperationType.CREATE}), checkRBAC.handler(), DatasetStatusTansition);
router.post("/datasets/health", setDataToRequestObject("api.dataset.health"), onRequest({ entity: Entity.Management }), checkRBAC.handler(), datasetHealth);
router.post("/datasets/reset/:datasetId", setDataToRequestObject("api.dataset.reset"), onRequest({ entity: Entity.Management }), checkRBAC.handler(), datasetReset);
router.post("/datasets/dataschema", setDataToRequestObject("api.datasets.dataschema"), onRequest({ entity: Entity.Management }), checkRBAC.handler(), DataSchemaGenerator);
router.get("/datasets/export/:dataset_id", setDataToRequestObject("api.datasets.export"), onRequest({ entity: Entity.Management }), checkRBAC.handler(), DatasetExport);
router.post("/datasets/copy", setDataToRequestObject("api.datasets.copy"), onRequest({ entity: Entity.Management }), telemetryAuditStart({action: telemetryActions.copyDataset, operationType: OperationType.CREATE}), checkRBAC.handler(), DatasetCopy);
router.post("/connectors/list", setDataToRequestObject("api.connectors.list"), onRequest({ entity: Entity.Management }), telemetryAuditStart({action: telemetryActions.listConnectors, operationType: OperationType.GET}), checkRBAC.handler(), ConnectorsList);
router.get("/connectors/read/:id", setDataToRequestObject("api.connectors.read"), onRequest({entity: Entity.Management }), telemetryAuditStart({action: telemetryActions.readConnectors, operationType: OperationType.GET}), checkRBAC.handler(), ConnectorsRead);
router.post("/datasets/import", setDataToRequestObject("api.datasets.import"), onRequest({ entity: Entity.Management }), checkRBAC.handler(), DatasetImport);
router.post("/connector/register", setDataToRequestObject("api.connector.register"), onRequest({ entity: Entity.Management }), connectorRegisterController);
//Wrapper Service
router.post("/obsrv/data/sql-query", setDataToRequestObject("api.obsrv.data.sql-query"), onRequest({ entity: Entity.Data_out }), checkRBAC.handler(), sqlQuery);
router.post("/data/metrics", setDataToRequestObject("api.data.metrics"), onRequest({ entity: Entity.Data_out }), datasetMetrics)

