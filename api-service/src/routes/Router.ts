import express from "express";
import dataIn from "../controllers/DataIngestion/DataIngestionController";

export const router = express.Router();
export const queryService=""

/** Ingestor API */
router.post(`/v1/data/in/:datasetId`, dataIn);
