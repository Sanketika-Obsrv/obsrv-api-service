import { Request, Response } from "express";
import * as _ from 'lodash';
import dataIngestorSchema from "./DataIngestor.json";
import { schemaValidation } from "../../services";

const dataIn = async (req: Request, res: Response) => {
    try {
        const datasetId = getDatasetId(req);
        await schemaValidation(req.body, dataIngestorSchema)
        req.body = { ...req.body.data, dataset: datasetId };
        const topic = await getTopicName();
        // push events to kafka topic not implemented
        res.status(200).send("Data ingested successfully.");
    }
    catch (err) {
        res.status(400).send("Faild to ingest data.");
    }
}

const getDatasetId = (req: Request) => {
    const datasetId = req.params.datasetId.trim()
    if (!_.isEmpty(datasetId)) {
        return datasetId
    }
    else {
        throw "datasetId parameter in url cannot be empty"
    }
}

const getTopicName = () => {
    // fetch dataset_config from the live dataset table using sequelize
    return "topic"
}

export default dataIn;