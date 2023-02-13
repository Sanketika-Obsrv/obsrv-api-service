import express from "express";
import { config } from "../configs/config";
import { HTTPConnector } from "../connectors/HttpConnector";
import { PostgresConnector } from "../connectors/PostgresConnector";
import { IngestionSchemaV2 } from "../generators/IngestionSchema";
import { ResponseHandler } from "../helpers/responseHandler";
import { IngestionConfig } from "../models/ingestionModels";
import { QueryService } from "../services/QueryService";
import { SchemaGeneratorService } from "../services/SchemaGeneratorService";
import { ValidationService } from "../services/ValidationService";
import { DatasetService } from "../services/DatasetService";
import { KafkaConnector } from "../connectors/KafkaConnector";
import { SchemaService } from "../services/SchemaService";
import routes from "./routesConfig";

export const kafkaConnector = new KafkaConnector(config.dataset_api.kafka.config)

export const postgresConnector = new PostgresConnector(config.postgres.pg_config)

const validationService = new ValidationService();
 
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
router.post(`${routes.SCHEMA.BASE_PATH}${routes.SCHEMA.API_VERSION}${routes.SCHEMA.INGESTION_SCHEMA.URL}`, ResponseHandler.setApiId(routes.SCHEMA.INGESTION_SCHEMA.API_ID), validationService.validateRequestBody, schemaGeneratorService.generateIngestionSchema);
router.post(`${routes.SCHEMA.BASE_PATH}${routes.SCHEMA.API_VERSION}${routes.SCHEMA.DATASET_SCHEMA.URL}`, ResponseHandler.setApiId(routes.SCHEMA.DATASET_SCHEMA.API_ID), validationService.validateRequestBody, schemaGeneratorService.generateDataSetSchema);


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

 
// const ingestionConfig = {
//     "dataSet": "obsrv-telemetry-events",
//     "indexCol": "ets",
//     "granularitySpec": {
//         "segmentGranularity": "DAY",
//         "queryGranularity": "HOUR",
//         "rollup": false
//     },
//     "tuningConfig": {
//         "maxRowPerSegment": 50000,
//         "taskCount": 1
//     },
//     "ioConfig": {
//         "topic": "obsrv.telemetry.input",
//         "bootstrapIp": "localhost:9092",
//         "taskDuration": "PT8H"
//     }
// }
// const ingestionSchemaV2 =  new IngestionSchemaV2("telemetry-raw", <IngestionConfig>ingestionConfig)
// //const sample = {"type":"object","properties":{"eid":{"type":"integer"},"ver":{"type":"string"},"syncts":{"type":"integer"},"ets":{"type":"integer"},"flags":{"type":"object","properties":{"pp_validation_processed":{"type":"boolean"},"pp_duplicate":{"type":"boolean"},"device_denorm":{"type":"boolean"},"dialcode_denorm":{"type":"boolean"},"content_denorm":{"type":"boolean"}},"required":["pp_validation_processed","pp_duplicate","device_denorm","dialcode_denorm","content_denorm"]},"dialcodedata":{"type":"object","properties":{"identifier":{"type":"string"},"channel":{"type":"string"},"publisher":{"type":"string"},"status":{"type":"integer"}},"required":["identifier","channel","publisher","status"]},"mid":{"type":"string"},"type":{"type":"string"},"tags":{"type":"array","items":{"type":"string"}},"actor":{"type":"object","properties":{"id":{"type":"string"},"type":{"type":"string"}},"required":["id","type"]},"edata":{"type":"object","properties":{"topn":{"type":"array","items":{"type":"object","properties":{"identifier":{"type":"string"}},"required":["identifier"]}},"query":{"type":"string"},"size":{"type":"integer"},"type":{"type":"string"},"filters":{"type":"object","properties":{"contentType":{"type":"array","items":{"type":"string"}},"mimeType":{"type":"object"},"resourceType":{"type":"object"},"status":{"type":"array","items":{"type":"string"}},"objectType":{"type":"array","items":{"type":"string"}},"dialcodes":{"type":"string"},"framework":{"type":"object"},"compatibilityLevel":{"type":"object","properties":{"max":{"type":"integer"},"min":{"type":"integer"}},"required":["max","min"]},"channel":{"type":"object","properties":{"ne":{"type":"array","items":{"type":"string"}}},"required":["ne"]}},"required":["contentType","mimeType","resourceType","status","objectType","dialcodes","framework","compatibilityLevel","channel"]},"sort":{"type":"object"}},"required":["topn","query","size","type","filters","sort"]},"@timestamp":{"type":"string","format":"date-time"},"context":{"type":"object","properties":{"pdata":{"type":"object","properties":{"ver":{"type":"string"},"id":{"type":"string"},"pid":{"type":"string"}},"required":["ver","id","pid"]},"did":{"type":"string"},"env":{"type":"string"},"channel":{"type":"string"}},"required":["pdata","did","env","channel"]},"@version":{"type":"string"},"object":{"type":"object","properties":{"id":{"type":"string"},"type":{"type":"string"}},"required":["id","type"]}},"required":["eid","ver","syncts","ets","flags","dialcodedata","mid","type","tags","actor","edata","@timestamp","context","@version","object"]}
// const json = '{"type":"object","properties":{"eid":{"type":"integer"},"ver":{"type":"string"},"syncts":{"type":"integer"},"ets":{"type":"integer"},"flags":{"type":"object","properties":{"pp_validation_processed":{"type":"boolean"},"pp_duplicate":{"type":"boolean"},"device_denorm":{"type":"boolean"},"dialcode_denorm":{"type":"boolean"},"content_denorm":{"type":"boolean"}},"required":["pp_validation_processed","pp_duplicate","device_denorm","dialcode_denorm","content_denorm"]},"dialcodedata":{"type":"object","properties":{"identifier":{"type":"string"},"channel":{"type":"string"},"publisher":{"type":"string"},"status":{"type":"integer"}},"required":["identifier","channel","publisher","status"]},"mid":{"type":"string"},"type":{"type":"string"},"tags":{"type":"array","items":{"type":"string"}},"actor":{"type":"object","properties":{"id":{"type":"string"},"type":{"type":"string"}},"required":["id","type"]},"edata":{"type":"object","properties":{"topn":{"type":"array","items":{"type":"object","properties":{"identifier":{"type":"string"}},"required":["identifier"]}},"query":{"type":"string"},"size":{"type":"integer"},"type":{"type":"string"},"filters":{"type":"object","properties":{"contentType":{"type":"array","items":{"type":"string"}},"mimeType":{"type":"object"},"resourceType":{"type":"object"},"status":{"type":"array","items":{"type":"string"}},"objectType":{"type":"array","items":{"type":"string"}},"dialcodes":{"type":"string"},"framework":{"type":"object"},"compatibilityLevel":{"type":"object","properties":{"max":{"type":"integer"},"min":{"type":"integer"}},"required":["max","min"]},"channel":{"type":"object","properties":{"ne":{"type":"array","items":{"type":"string"}}},"required":["ne"]}},"required":["contentType","mimeType","resourceType","status","objectType","dialcodes","framework","compatibilityLevel","channel"]},"sort":{"type":"object"}},"required":["topn","query","size","type","filters","sort"]},"@timestamp":{"type":"string","format":"date-time"},"context":{"type":"object","properties":{"pdata":{"type":"object","properties":{"ver":{"type":"string"},"id":{"type":"string"},"pid":{"type":"string"}},"required":["ver","id","pid"]},"did":{"type":"string"},"env":{"type":"string"},"channel":{"type":"string"}},"required":["pdata","did","env","channel"]},"@version":{"type":"string"},"object":{"type":"object","properties":{"id":{"type":"string"},"type":{"type":"string"}},"required":["id","type"]}},"required":["eid","ver","syncts","ets","flags","dialcodedata","mid","type","tags","actor","edata","@timestamp","context","@version","object"]}'
// const map = new Map(Object.entries(JSON.parse(json)));
// ingestionSchemaV2.generate(map)
export { router };
 