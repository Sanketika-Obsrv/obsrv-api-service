import express from "express";
import dataIn from "../controllers/DataIngestion/DataIngestionController";
import DatasetCreate from "../controllers/DatasetCreate/DatasetCreate";
import DatasetUpdate from "../controllers/DatasetUpdate/DatasetUpdate";
import DatasetRead from "../controllers/DatasetRead/DatasetRead";
import dataOut from "../controllers/DataOut/DataOutController";
import { setApiId } from "../middlewares/setApiId";
import { config } from "../configs/Config";
import { ClientCloudService } from "../controllers/ClientCloudService/ClientCloudService";
export const exhaustService = new ClientCloudService(config.exhaust_config.cloud_storage_provider, config.exhaust_config.cloud_storage_config);

export const router = express.Router();

router.post(`/v1/data/in/:datasetId`, dataIn);
router.post('/v1/data/query', dataOut);
router.post("/v1/datasets/create", setApiId("api.datasets.create"), DatasetCreate)
router.patch("/v1/datasets/update", setApiId("api.datasets.update"), DatasetUpdate)
router.get("/v1/datasets/read/:dataset_id", setApiId("api.datasets.read"), DatasetRead)
