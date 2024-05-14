import express from "express";
import dataIn from "../controllers/DataIngestion/DataIngestionController";
import DatasetCreate from "../controllers/DatasetCreate/DatasetCreate";
import dataOut from "../controllers/DataOut/DataOutController";
import DatasetUpdate from "../controllers/DatasetUpdate/DatasetUpdate";
import DatasetRead from "../controllers/DatasetRead/DatasetRead";
import DatasetList from "../controllers/DatasetList/DatasetList"
import { dataExhaust } from "../controllers/DataExhaust/DataExhaustController";
import { onRequest } from "../metrics/prometheus/helpers";
import { metricsScrapeHandler } from "../metrics/prometheus";
import { Entity } from "../types/MetricModel";
import { createQueryTemplate } from "../controllers/CreateQueryTemplate/CreateTemplateController";
import { setDataToRequestObject } from "../middlewares/setDataToRequestObject";
import { readQueryTemplate } from "../controllers/ReadQueryTemplate/ReadTemplateController";
import { deleteQueryTemplate } from "../controllers/DeleteQueryTemplate/DeleteTemplateController";
import { listQueryTemplates } from "../controllers/ListQueryTemplates/ListTemplatesController";
import SampleUploadURL from "../controllers/SampleUploadURL/SampleUploadURL";

export const router = express.Router();

router.post(`/v1/data/in/:datasetId`, setDataToRequestObject("api.data.in"), onRequest({ entity: Entity.Data_in }), dataIn);
router.post('/v1/data/query/:datasetId', setDataToRequestObject("api.data.out"), onRequest({ entity: Entity.Data_out }), dataOut);
router.post("/v1/datasets/create", setDataToRequestObject("api.datasets.create"), onRequest({ entity: Entity.Management }), DatasetCreate)
router.patch("/v1/datasets/update", setDataToRequestObject("api.datasets.update"), onRequest({ entity: Entity.Management }), DatasetUpdate)
router.get("/v1/datasets/read/:dataset_id", setDataToRequestObject("api.datasets.read"), onRequest({ entity: Entity.Management }), DatasetRead)
router.post("/v1/datasets/list", setDataToRequestObject("api.datasets.list"), onRequest({ entity: Entity.Management }), DatasetList)
router.get('/v1/data/exhaust/:datasetId', setDataToRequestObject("api.data.exhaust"), onRequest({ entity: Entity.Management }), dataExhaust);
router.post('/v1/template/create', setDataToRequestObject("api.query.template.create"), createQueryTemplate);
router.get('/v1/template/read/:templateId', setDataToRequestObject("api.query.template.read"), readQueryTemplate);
router.delete('/v1/template/delete/:templateId', setDataToRequestObject("api.query.template.delete"), deleteQueryTemplate);
router.post('/v1/template/list', setDataToRequestObject("api.query.template.list"), listQueryTemplates);
router.post('/v1/datasets/sample/upload-url', setDataToRequestObject("api.datasets.upload-url"), onRequest({ entity: Entity.Management }), SampleUploadURL);

//Scrape metrics to prometheus
router.get('/metrics', metricsScrapeHandler)
