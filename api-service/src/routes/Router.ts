import express from "express";
import DatasetCreate from "../controllers/DatasetCreate/DatasetCreate";

export const router = express.Router();

router.post("/v1/datasets/create", DatasetCreate)