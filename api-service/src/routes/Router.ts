import express from "express";
import dataIn from "../controllers/DataIngestion/DataIngestionController";
import DatasetCreate from "../controllers/DatasetCreate/DatasetCreate";

export const router = express.Router();

router.post(`/v1/data/in/:datasetId`, dataIn);

router.post("/v1/datasets/create", DatasetCreate)
