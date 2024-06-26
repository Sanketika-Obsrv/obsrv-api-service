import express from "express";
import dataIn from "../controllers/DataIngestion/DataIngestionController";
import DatasetCreate from "../controllers/DatasetCreate/DatasetCreate";
import dataOut from "../controllers/DataOut/DataOutController";
import DatasetUpdate from "../controllers/DatasetUpdate/DatasetUpdate";
import DatasetRead from "../controllers/DatasetRead/DatasetRead";
import DatasetList from "../controllers/DatasetList/DatasetList"
import { dataExhaust } from "../controllers/DataExhaust/DataExhaustController";
import { onRequest } from "../metrics/prometheus/helpers";

import { Entity } from "../types/MetricModel";
import { createQueryTemplate } from "../controllers/CreateQueryTemplate/CreateTemplateController";
import { setDataToRequestObject } from "../middlewares/setDataToRequestObject";
import { readQueryTemplate } from "../controllers/ReadQueryTemplate/ReadTemplateController";
import { deleteQueryTemplate } from "../controllers/DeleteQueryTemplate/DeleteTemplateController";
import { listQueryTemplates } from "../controllers/ListQueryTemplates/ListTemplatesController";
import { queryTemplate } from "../controllers/QueryTemplate/QueryTemplateController";
import { updateQueryTemplate } from "../controllers/UpdateQueryTemplate/UpdateTemplateController";
import { eventValidation } from "../controllers/EventValidation/EventValidation";
import GenerateSignedURL from "../controllers/GenerateSignedURL/GenerateSignedURL";
import { sqlQuery } from "../controllers/QueryWrapper/SqlQueryWrapper";

export const router = express.Router();

router.post("/data/in/:datasetId", setDataToRequestObject("api.data.in"), onRequest({ entity: Entity.Data_in }), dataIn);
router.post("/data/query/:datasetId", setDataToRequestObject("api.data.out"), onRequest({ entity: Entity.Data_out }), dataOut);
router.post("/datasets/create", setDataToRequestObject("api.datasets.create"), onRequest({ entity: Entity.Management }), DatasetCreate)
router.patch("/datasets/update", setDataToRequestObject("api.datasets.update"), onRequest({ entity: Entity.Management }), DatasetUpdate)
router.get("/datasets/read/:dataset_id", setDataToRequestObject("api.datasets.read"), onRequest({ entity: Entity.Management }), DatasetRead)
router.post("/datasets/list", setDataToRequestObject("api.datasets.list"), onRequest({ entity: Entity.Management }), DatasetList)
router.get("/data/exhaust/:datasetId", setDataToRequestObject("api.data.exhaust"), onRequest({ entity: Entity.Management }), dataExhaust);
router.post("/template/create", setDataToRequestObject("api.query.template.create"), createQueryTemplate);
router.get("/template/read/:templateId", setDataToRequestObject("api.query.template.read"), readQueryTemplate);
router.delete("/template/delete/:templateId", setDataToRequestObject("api.query.template.delete"), deleteQueryTemplate);
router.post("/template/list", setDataToRequestObject("api.query.template.list"), listQueryTemplates);
router.patch("/template/update/:templateId", setDataToRequestObject("api.query.template.update"), updateQueryTemplate);
router.post("/schema/validate", setDataToRequestObject("api.schema.validator"), eventValidation); 
router.post("/template/query/:templateId", setDataToRequestObject("api.query.template.query"), queryTemplate);
router.post("/files/generate-url", setDataToRequestObject("api.files.generate-url"), onRequest({ entity: Entity.Management }), GenerateSignedURL);

//Wrapper Service
router.post("/obsrv/data/sql-query", setDataToRequestObject("api.obsrv.data.sql-query"), onRequest({ entity: Entity.Data_out }), sqlQuery);

