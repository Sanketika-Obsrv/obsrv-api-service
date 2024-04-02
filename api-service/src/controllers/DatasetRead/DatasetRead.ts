import { Request, Response } from "express";
import { DatasetStatus } from "../../types/DatasetModels";

const datasetRead = async (req: Request, res: Response) => {
    try {
        const { dataset_id } = req.params;
        const { fields, status = DatasetStatus.Live } = req.query;
        
        
    } catch (error) {

    }
}