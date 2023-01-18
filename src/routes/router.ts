import { AxiosInstance } from "axios";
import express from "express";
import { config } from "../configs/config";
import { HTTPConnector } from "../connectors/HttpConnector";
import { PostgresConnector } from "../connectors/PostgresConnector";
import { ResponseHandler } from "../helpers/responseHandler";
import { IConnector } from "../models/ingestionModels";
import { QueryService } from "../services/QueryService";
import { SchemaGeneratorService } from "../services/SchemaGeneratorService";
import { ValidationService } from "../services/validationService";
import { DatasetService } from "../services/datasetService";

import routes from "./routesConfig";

const httpConnector: IConnector = new HTTPConnector(`${config.query_api.druid.host}:${config.query_api.druid.port}`)
const queryService = new QueryService();
const datasetService = new DatasetService();

const pgConfig = {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'manjunathdavanam',
    password: 'Manju@123',
}
const postgresConnector: IConnector = new PostgresConnector(pgConfig)
const schemaGeneratorService = new SchemaGeneratorService(postgresConnector);
const router = express.Router();
const responseHandler = new ResponseHandler();



const validationService = new ValidationService("/src/configs/");


/**
 * Query Service Routes
 */

router.post(`${routes.QUERY.BASE_PATH}${routes.QUERY.API_VERSION}${routes.QUERY.NATIVE_QUERY.URL}`, responseHandler.setApiId(routes.QUERY.NATIVE_QUERY.API_ID), validationService.validateRequestBody, validationService.validateConfiguration, validationService.validateNativeQuery, queryService.executeNativeQuery);
router.post(`${routes.QUERY.BASE_PATH}${routes.QUERY.API_VERSION}${routes.QUERY.SQL_QUERY.URL}`, responseHandler.setApiId(routes.QUERY.SQL_QUERY.API_ID), validationService.validateRequestBody, validationService.validateConfiguration, validationService.validateSqlQuery, queryService.executeSqlQuery);


/**
 * Generator Service Routes
 */
router.post(`${routes.SCHEMA.BASE_PATH}${routes.SCHEMA.API_VERSION}${routes.SCHEMA.INGESTION_SCHEMA.URL}`, responseHandler.setApiId(routes.SCHEMA.INGESTION_SCHEMA.API_ID), schemaGeneratorService.generateIngestionSchema);
router.post(`${routes.SCHEMA.BASE_PATH}${routes.SCHEMA.API_VERSION}${routes.SCHEMA.DATASET_SCHEMA.URL}`, responseHandler.setApiId(routes.SCHEMA.DATASET_SCHEMA.API_ID), schemaGeneratorService.generateDataSetSchema);


/**
 * 
 * Dataset service routers
 * 
 */
router.post(`${routes.DATASET.BASE_PATH}${routes.DATASET.API_VERSION}${routes.DATASET.CREATE.URL}`, responseHandler.setApiId(routes.DATASET.CREATE.API_ID), datasetService.createDataset);
router.patch(`${routes.DATASET.BASE_PATH}${routes.DATASET.API_VERSION}${routes.DATASET.UPDATE.URL}`, responseHandler.setApiId(routes.DATASET.UPDATE.API_ID), datasetService.updateDataset);
router.delete(`${routes.DATASET.BASE_PATH}${routes.DATASET.API_VERSION}${routes.DATASET.DELETE.URL}`, responseHandler.setApiId(routes.DATASET.DELETE.API_ID), datasetService.deleteDataset);





export { router };
