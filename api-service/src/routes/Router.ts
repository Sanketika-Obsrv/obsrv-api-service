import express from "express";
import dataIn from "../controllers/DataIngestion/DataIngestionController";

export const router = express.Router();

router.post(`/v1/data/in/:datasetId`, dataIn);
