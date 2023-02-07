import express from "express";
import { config } from "../configs/config";
import { HTTPConnector } from "../connectors/HttpConnector";
import { PostgresConnector } from "../connectors/PostgresConnector";
import { ResponseHandler } from "../helpers/responseHandler";
import { QueryService } from "../services/QueryService";
import { SchemaGeneratorService } from "../services/SchemaGeneratorService";
import { ValidationService } from "../services/ValidationService";
import { DatasetService } from "../services/DatasetService";
import { KafkaConnector } from "../connectors/KafkaConnector";
import { SchemaService } from "../services/SchemaService";
import routes from "./routesConfig";

export const kafkaConnector = new KafkaConnector(config.dataset_api.kafka.config)

export const postgresConnector = new PostgresConnector(config.postgres.pg_config)

const validationService = new ValidationService("/src/configs/");

const queryService = new QueryService(new HTTPConnector(`${config.query_api.druid.host}:${config.query_api.druid.port}`));

const schemaGeneratorService = new SchemaGeneratorService(new PostgresConnector(config.postgres.pg_config));

export const schemaService = new SchemaService(postgresConnector)

export const datasetService = new DatasetService(kafkaConnector);

const router = express.Router();


/**
 * Query Service Routes
 */

router.post(`${routes.QUERY.BASE_PATH}${routes.QUERY.API_VERSION}${routes.QUERY.NATIVE_QUERY.URL}`, ResponseHandler.setApiId(routes.QUERY.NATIVE_QUERY.API_ID), validationService.validateRequestBody, validationService.validateConfiguration, validationService.validateNativeQuery, queryService.executeNativeQuery);
router.post(`${routes.QUERY.BASE_PATH}${routes.QUERY.API_VERSION}${routes.QUERY.SQL_QUERY.URL}`, ResponseHandler.setApiId(routes.QUERY.SQL_QUERY.API_ID), validationService.validateRequestBody, validationService.validateConfiguration, validationService.validateSqlQuery, queryService.executeSqlQuery);


/**
 * Generator Service Routes
 */
router.post(`${routes.SCHEMA.BASE_PATH}${routes.SCHEMA.API_VERSION}${routes.SCHEMA.INGESTION_SCHEMA.URL}`, ResponseHandler.setApiId(routes.SCHEMA.INGESTION_SCHEMA.API_ID), schemaGeneratorService.generateIngestionSchema);
router.post(`${routes.SCHEMA.BASE_PATH}${routes.SCHEMA.API_VERSION}${routes.SCHEMA.DATASET_SCHEMA.URL}`, ResponseHandler.setApiId(routes.SCHEMA.DATASET_SCHEMA.API_ID), schemaGeneratorService.generateDataSetSchema);


/**
 * 
 * Dataset service routers
 * 
 */
router.post(`${routes.DATASET.BASE_PATH}${routes.DATASET.API_VERSION}${routes.DATASET.CREATE.URL}`, ResponseHandler.setApiId(routes.DATASET.CREATE.API_ID), datasetService.create);
// router.patch(`${routes.DATASET.BASE_PATH}${routes.DATASET.API_VERSION}${routes.DATASET.UPDATE.URL}`, ResponseHandler.setApiId(routes.DATASET.UPDATE.API_ID), datasetService.update);
// router.delete(`${routes.DATASET.BASE_PATH}${routes.DATASET.API_VERSION}${routes.DATASET.DELETE.URL}`, ResponseHandler.setApiId(routes.DATASET.DELETE.API_ID), datasetService.delete);


/**
 * Management Services
 */




/**
 * Schema Service Routes
 */
router.post(`${routes.SCHEMA_OPERATIONS.BASE_PATH}${routes.SCHEMA_OPERATIONS.API_VERSION}${routes.SCHEMA_OPERATIONS.SAVE.URL}`, ResponseHandler.setApiId(routes.SCHEMA_OPERATIONS.SAVE.API_ID), validationService.validateRequestBody, schemaService.save)
router.get(`${routes.SCHEMA_OPERATIONS.BASE_PATH}${routes.SCHEMA_OPERATIONS.API_VERSION}${routes.SCHEMA_OPERATIONS.READ.URL}`, ResponseHandler.setApiId(routes.SCHEMA_OPERATIONS.READ.API_ID), schemaService.read)


export { router };