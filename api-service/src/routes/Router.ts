import express from "express";
import dataIn from "../controllers/DataIngestion/DataIngestionController";
import DatasetCreate from "../controllers/DatasetCreate/DatasetCreate";
import dataOut from "../controllers/DataOut/DataOutController";
import DatasetUpdate from "../controllers/DatasetUpdate/DatasetUpdate";
import DatasetRead from "../controllers/DatasetRead/DatasetRead";
import { setApiId } from "../middlewares/setApiId";
import DatasetList from "../controllers/DatasetList/DatasetList"
import { dataExhaust } from "../controllers/DataExhaust/DataExhaustController";
import { onRequest } from "../metrics/prometheus/helpers";
import { metricsScrapeHandler } from "../metrics/prometheus";
import { Entity } from "../types/MetricModel";

export const router = express.Router();

router.post(`/v1/data/in/:datasetId`, setApiId("api.data.in"), onRequest({ entity: Entity.Data_in }), dataIn);
router.post('/v1/data/query/:datasetId', setApiId("api.data.out"), onRequest({ entity: Entity.Data_out }), dataOut);
router.post("/v1/datasets/create", setApiId("api.datasets.create"), onRequest({ entity: Entity.Management }), DatasetCreate)
router.patch("/v1/datasets/update", setApiId("api.datasets.update"), onRequest({ entity: Entity.Management }), DatasetUpdate)
router.get("/v1/datasets/read/:dataset_id", setApiId("api.datasets.read"), onRequest({ entity: Entity.Management }), DatasetRead)
router.post("/v1/datasets/list", setApiId("api.datasets.list"), onRequest({ entity: Entity.Management }), DatasetList)
router.get('/v1/data/exhaust/:datasetId', setApiId("api.data.exhaust"), onRequest({ entity: Entity.Management }), dataExhaust);

//Scrape metrics to prometheus
router.get('/metrics', metricsScrapeHandler)
