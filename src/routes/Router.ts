import express from "express";
import { config } from "../configs/Config";
import { HTTPConnector } from "../connectors/HttpConnector";
import { ResponseHandler } from "../helpers/ResponseHandler";
import { QueryService } from "../services/QueryService";
import { ValidationService } from "../services/ValidationService";
import { DatasetService } from "../services/DatasetService";
import { KafkaConnector } from "../connectors/KafkaConnector";
import { DataSourceService } from "../services/DataSourceService";
import { DatasetSourceConfigService } from "../services/DatasetSourceConfigService";
import { DbConnector } from "../connectors/DbConnector";
import { routesConfig } from "../configs/RoutesConfig";
import { IngestorService } from "../services/IngestorService";
import { OperationType, telemetryAuditStart } from "../services/telemetry";
import telemetryActions from "../data/telemetryActions";
import { ClientCloudService } from "../services/ClientCloudService";
import { WrapperService } from "../services/WrapperService";
import { onRequest } from "../helpers/prometheus/helpers";
import promEntities from "../helpers/prometheus/entities";
import { metricsScrapeHandler } from "../helpers/prometheus";

export const validationService = new ValidationService();

export const queryService = new QueryService(new HTTPConnector(`${config.query_api.druid.host}:${config.query_api.druid.port}`));

export const kafkaConnector = new KafkaConnector()

export const dbConnector = new DbConnector(config.db_connector_config);

export const datasourceService = new DataSourceService(dbConnector, config.table_names.datasources);
export const datasetService = new DatasetService(dbConnector, config.table_names.datasets);
export const datasetSourceConfigService = new DatasetSourceConfigService(dbConnector, config.table_names.datasetSourceConfig);
export const ingestorService = new IngestorService(kafkaConnector, new HTTPConnector(`${config.query_api.druid.host}:${config.query_api.druid.port}`));
export const exhaustService = new ClientCloudService(config.exhaust_config.cloud_storage_provider, config.exhaust_config.cloud_storage_config);
export const wrapperService = new WrapperService();
export const globalCache: any = new Map()
export const router = express.Router()
dbConnector.init()
/** Query API(s) */
router.post([`${routesConfig.query.native_query.path}`, `${routesConfig.query.native_query_with_params.path}`], ResponseHandler.setApiId(routesConfig.query.native_query.api_id), onRequest({ entity: promEntities.data_out }), validationService.validateRequestBody, validationService.validateQuery, queryService.executeNativeQuery);
router.post([`${routesConfig.query.sql_query.path}`, `${routesConfig.query.sql_query_with_params.path}`], ResponseHandler.setApiId(routesConfig.query.sql_query.api_id), onRequest({ entity: promEntities.data_out }), validationService.validateRequestBody, validationService.validateQuery, queryService.executeSqlQuery);

/** Ingestor API */
router.post(`${routesConfig.data_ingest.path}`, ResponseHandler.setApiId(routesConfig.data_ingest.api_id), onRequest({ entity: promEntities.data_in }), validationService.validateRequestBody, ingestorService.create);

/** Dataset APIs */
router.post(`${routesConfig.config.dataset.save.path}`, ResponseHandler.setApiId(routesConfig.config.dataset.save.api_id), validationService.validateRequestBody, telemetryAuditStart({ action: telemetryActions.createDataset, operationType: OperationType.CREATE }), datasetService.save);
router.patch(`${routesConfig.config.dataset.update.path}`, ResponseHandler.setApiId(routesConfig.config.dataset.update.api_id), validationService.validateRequestBody, telemetryAuditStart({ action: telemetryActions.updateDataset, operationType: OperationType.UPDATE }), datasetService.update);
router.get(`${routesConfig.config.dataset.read.path}`, ResponseHandler.setApiId(routesConfig.config.dataset.read.api_id), datasetService.read);
router.post(`${routesConfig.config.dataset.list.path}`, ResponseHandler.setApiId(routesConfig.config.dataset.list.api_id), validationService.validateRequestBody, datasetService.list);

/** Dataset Source Config APIs */
router.post(`${routesConfig.config.dataset_source_config.save.path}`, ResponseHandler.setApiId(routesConfig.config.dataset_source_config.save.api_id), validationService.validateRequestBody, telemetryAuditStart({ action: telemetryActions.createDatasetSourceConfig, operationType: OperationType.CREATE }), datasetSourceConfigService.save);
router.patch(`${routesConfig.config.dataset_source_config.update.path}`, ResponseHandler.setApiId(routesConfig.config.dataset_source_config.update.api_id), validationService.validateRequestBody, telemetryAuditStart({ action: telemetryActions.updateDatasetSourceConfig, operationType: OperationType.UPDATE }), datasetSourceConfigService.update);
router.get(`${routesConfig.config.dataset_source_config.read.path}`, ResponseHandler.setApiId(routesConfig.config.dataset_source_config.read.api_id), datasetSourceConfigService.read);
router.post(`${routesConfig.config.dataset_source_config.list.path}`, ResponseHandler.setApiId(routesConfig.config.dataset_source_config.list.api_id), validationService.validateRequestBody, datasetSourceConfigService.list);

/** DataSource API(s) */
router.post(`${routesConfig.config.datasource.save.path}`, ResponseHandler.setApiId(routesConfig.config.datasource.save.api_id), validationService.validateRequestBody, telemetryAuditStart({ action: telemetryActions.createDatasource, operationType: OperationType.CREATE }), datasourceService.save);
router.patch(`${routesConfig.config.datasource.update.path}`, ResponseHandler.setApiId(routesConfig.config.datasource.update.api_id), validationService.validateRequestBody, telemetryAuditStart({ action: telemetryActions.updateDatasource, operationType: OperationType.UPDATE }), datasourceService.update);
router.get(`${routesConfig.config.datasource.read.path}`, ResponseHandler.setApiId(routesConfig.config.datasource.read.api_id), datasourceService.read);
router.post(`${routesConfig.config.datasource.list.path}`, ResponseHandler.setApiId(routesConfig.config.datasource.list.api_id), validationService.validateRequestBody, datasourceService.list);

/** Exhaust API(s) */
router.get(`${routesConfig.exhaust.path}`, ResponseHandler.setApiId(routesConfig.exhaust.api_id), validationService.validateRequestParams, exhaustService.getData);
router.get(`${routesConfig.prometheus.path}`, metricsScrapeHandler);

 /*** Submit Ingestion API(s) */
router.post(`${routesConfig.submit_ingestion.path}`, ResponseHandler.setApiId(routesConfig.submit_ingestion.api_id), validationService.validateRequestBody, ingestorService.submitIngestion)
 
/** Query Wrapper API(s) */
router.post(routesConfig.query_wrapper.sql_wrapper.path, ResponseHandler.setApiId(routesConfig.query_wrapper.sql_wrapper.api_id), onRequest({ entity: promEntities.data_out }), wrapperService.forwardSql)
router.post(routesConfig.query_wrapper.native_post.path, ResponseHandler.setApiId(routesConfig.query_wrapper.native_post.api_id), onRequest({ entity: promEntities.data_out }), wrapperService.forwardNative)
router.get(routesConfig.query_wrapper.native_get.path, ResponseHandler.setApiId(routesConfig.query_wrapper.native_get.api_id), onRequest({ entity: promEntities.data_out }), wrapperService.forwardNativeGet)
router.delete(routesConfig.query_wrapper.native_delete.path, ResponseHandler.setApiId(routesConfig.query_wrapper.native_delete.api_id), onRequest({ entity: promEntities.data_out }), wrapperService.forwardNativeDel)
router.get(routesConfig.query_wrapper.druid_status.path, ResponseHandler.setApiId(routesConfig.query_wrapper.druid_status.api_id), wrapperService.nativeStatus)
