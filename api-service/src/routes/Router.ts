import express from "express";
import Datasets from "../controllers/dataset/Datasets";

export const router = express.Router();
export const queryService = ""

router.post("/v1/datasets/create", Datasets.create)