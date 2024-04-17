import express from "express";
import dataIn from "../controllers/DataIngestion/DataIngestionController";
import DatasetCreate from "../controllers/DatasetCreate/DatasetCreate";
import dataOut from "../controllers/DataOut/DataOutController";
import DatasetUpdate from "../controllers/DatasetUpdate/DatasetUpdate";
import DatasetRead from "../controllers/DatasetRead/DatasetRead";
import { setApiId } from "../middlewares/setApiId";
import DatasetList from "../controllers/DatasetList/DatasetList"
import { dataExhaust } from "../controllers/DataExhaust/DataExhaustController";

export const router = express.Router();

router.post(`/v1/data/in/:datasetId`, setApiId("api.data.in"), dataIn);
router.post('/v1/data/query', setApiId("api.data.out"), dataOut);
router.post("/v1/datasets/create", setApiId("api.datasets.create"), DatasetCreate)
router.patch("/v1/datasets/update", setApiId("api.datasets.update"), DatasetUpdate)
router.get("/v1/datasets/read/:dataset_id", setApiId("api.datasets.read"), DatasetRead)
router.post("/v1/datasets/list", setApiId("api.datasets.list"), DatasetList)
router.get('/v1/data/exhaust/:datasetId', setApiId("api.data.exhaust"), dataExhaust);
