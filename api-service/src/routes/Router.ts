import express from "express";
import DatasetCreate from "../controllers/DatasetCreate/DatasetCreate";

export const router = express.Router();
export const queryService = ""

router.post("/v1/datasets/create", DatasetCreate)