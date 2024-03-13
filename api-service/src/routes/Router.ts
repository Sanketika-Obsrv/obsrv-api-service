import express from "express";
import dataIn from "../controllers/DataIngestor/DataIngestorService";

export const router = express.Router();
export const queryService=""

/** Ingestor API */
router.post(`/v1/data/in/:datasetId`, dataIn);
