import express from "express";
import { config } from "../configs/Config";
import { HTTPConnector } from "../connectors/HttpConnector";
import { PostgresConnector } from "../connectors/PostgresConnector";
import { ResponseHandler } from "../helpers/ResponseHandler";
import { QueryService } from "../services/QueryService";
import { SchemaGeneratorService } from "../services/SchemaGeneratorService";
import { ValidationService } from "../services/ValidationService";
import { DatasetService } from "../services/DatasetService";
import { KafkaConnector } from "../connectors/KafkaConnector";
import { DatasetSchemaService } from "../services/DatasetSchemaService";
import routes from "./RoutesConfig";
import { DbConnector } from "../connectors/DbConnector";

export const kafkaConnector = new KafkaConnector(config.dataset_api.kafka.config)

export const postgresConnector = new PostgresConnector(config.postgres.pg_config)

export const dbConnector = new DbConnector(config.db_connector_config)

const validationService = new ValidationService();

const queryService = new QueryService(new HTTPConnector(`${config.query_api.druid.host}:${config.query_api.druid.port}`));

const schemaGeneratorService = new SchemaGeneratorService(new PostgresConnector(config.postgres.pg_config));

export const datasetSchemaService = new DatasetSchemaService(dbConnector)

export const datasetService = new DatasetService(kafkaConnector);



const router = express.Router();


/**
 * Query API(s)
 */

router.post(`${routes.QUERY.BASE_PATH}${routes.QUERY.API_VERSION}${routes.QUERY.NATIVE_QUERY.URL}`, ResponseHandler.setApiId(routes.QUERY.NATIVE_QUERY.API_ID), validationService.validateRequestBody, validationService.validateQuery, queryService.executeNativeQuery);
router.post(`${routes.QUERY.BASE_PATH}${routes.QUERY.API_VERSION}${routes.QUERY.SQL_QUERY.URL}`, ResponseHandler.setApiId(routes.QUERY.SQL_QUERY.API_ID), validationService.validateRequestBody, validationService.validateQuery, queryService.executeSqlQuery);


/**
 * Schema Generator API(s)
 */
router.post(`${routes.SCHEMA.BASE_PATH}${routes.SCHEMA.API_VERSION}${routes.SCHEMA.INGESTION_SCHEMA.URL}`, ResponseHandler.setApiId(routes.SCHEMA.INGESTION_SCHEMA.API_ID), validationService.validateRequestBody, schemaGeneratorService.generateIngestionSchema);
router.post(`${routes.SCHEMA.BASE_PATH}${routes.SCHEMA.API_VERSION}${routes.SCHEMA.DATASET_SCHEMA.URL}`, ResponseHandler.setApiId(routes.SCHEMA.DATASET_SCHEMA.API_ID), validationService.validateRequestBody, schemaGeneratorService.generateDataSetSchema);
router.post(`${routes.SCHEMA.BASE_PATH}${routes.SCHEMA.API_VERSION}${routes.SYSTEM_SETTINGS.CONFIG_LABEL.URL}`, ResponseHandler.setApiId(routes.SYSTEM_SETTINGS.CONFIG_LABEL.API_ID),);

/**
 * System Configuration labels API
 */
router.post(`${routes.DATASET.BASE_PATH}${routes.DATASET.API_VERSION}${routes.DATASET.CREATE.URL}`, ResponseHandler.setApiId(routes.DATASET.CREATE.API_ID), datasetService.create);


/**
 * Schema Service Routes
 */
router.get(`${routes.SCHEMA_OPERATIONS.BASE_PATH}${routes.SCHEMA_OPERATIONS.API_VERSION}${routes.SCHEMA_OPERATIONS.READ.URL}`, ResponseHandler.setApiId(routes.SCHEMA_OPERATIONS.READ.API_ID), datasetSchemaService.read)
router.post(`${routes.SCHEMA_OPERATIONS.BASE_PATH}${routes.SCHEMA_OPERATIONS.API_VERSION}${routes.SCHEMA_OPERATIONS.SAVE.URL}`, ResponseHandler.setApiId(routes.SCHEMA_OPERATIONS.SAVE.API_ID), datasetSchemaService.save)
router.patch(`${routes.SCHEMA_OPERATIONS.BASE_PATH}${routes.SCHEMA_OPERATIONS.API_VERSION}${routes.SCHEMA_OPERATIONS.SAVE.URL}`, ResponseHandler.setApiId(routes.SCHEMA_OPERATIONS.SAVE.API_ID), datasetSchemaService.update)





/**
 * Config API(s)
 */


export { router };
