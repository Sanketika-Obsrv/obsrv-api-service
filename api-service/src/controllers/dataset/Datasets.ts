import { Request, Response } from "express";
import logger from "../../logger";
import { checkRecordExists, setDefaults } from "../../services/DatasetService";
import _ from "lodash";
import DatasetSave from "./DatasetSave.json";
import { schemaValidation, setApiId } from "../../services";

const create = async (req: Request, res: Response) => {
    try {
        const alertBody = req.body;
        await setApiId(req)
        await schemaValidation(alertBody, DatasetSave)
        await checkRecordExists(_.get(req, ["body", "dataset_id"]));
        const alertPayload = setDefaults(alertBody);
        // const response = await datasets_draft.create(alertPayload)
        res.status(200).json({ message: "Dataset record saved successfully", alertPayload })
    } catch (error: any) {
        logger.error(error)
        res.status(500).json({ message: error.message })
    }
}

export default {
    create
}