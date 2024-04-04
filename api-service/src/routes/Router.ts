import express from "express";
import dataIn from "../controllers/DataIngestion/DataIngestionController";
import DatasetCreate from "../controllers/DatasetCreate/DatasetCreate";
import DatasetUpdate from "../controllers/DatasetUpdate/DatasetUpdate";
import dataOut from "../controllers/DataOut/DataOutController";
import { setApiId } from "../middleware/setApiId";


export const router = express.Router();

router.post(`/v1/data/in/:datasetId`, dataIn);
router.post('/v1/data/query', dataOut);
router.post("/v1/datasets/create", setApiId("api.datasets.create"), DatasetCreate)
router.patch("/v1/datasets/update", setApiId("api.datasets.update"), DatasetUpdate)
