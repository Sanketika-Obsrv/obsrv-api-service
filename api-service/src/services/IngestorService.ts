import { Request, Response, NextFunction } from "express";
import constants from "../resources/Constants.json"
import { ResponseHandler } from "../helpers/ResponseHandler";
import _ from 'lodash'
import httpStatus from "http-status";
import { globalCache } from "../routes/Router";
import { refreshDatasetConfigs } from "../helpers/DatasetConfigs";
import { IConnector } from "../models/DatasetModels";
import { config } from '../configs/Config'
import { AxiosInstance } from "axios";
import { wrapperService } from "../routes/Router";
export class IngestorService {
    private kafkaConnector: IConnector;
    private httpConnector: AxiosInstance
    constructor(kafkaConnector: IConnector, httpConnector: IConnector) {
        this.kafkaConnector = kafkaConnector
        this.httpConnector = httpConnector.connect()
        this.init()
    }
    public init() {
        this.kafkaConnector.connect()
            .then(() => {
                console.log("kafka connection arranged succesfully...")
            })
            .catch((error: any) => {
                console.log("error while connecting to kafka", error.message)
            })
    }
    public create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const datasetId = this.getDatasetId(req);
            req.body = { ...req.body.data, dataset: datasetId };
            const topic = await this.getTopic(datasetId);
            await this.kafkaConnector.execute(req, res, topic);
            ResponseHandler.successResponse(req, res, { status: 200, data: { message: constants.DATASET.CREATED } });
        } catch (error: any) {
            console.error(error.message)
            next({ statusCode: error.status || httpStatus.INTERNAL_SERVER_ERROR, message: error.message || "", errCode: error.code || httpStatus["500_NAME"] });
        }

    }
    public submitIngestion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await wrapperService.submitIngestion(req.body)
            ResponseHandler.successResponse(req, res, { status: 200, data: { message: constants.INGESTION_SUBMITTED } });
        }
        catch (error: any) {
            let errorMessage = error?.response?.data?.error || "Internal Server Error"
            console.error(errorMessage)
            next({ statusCode: error.status || httpStatus.INTERNAL_SERVER_ERROR, message: errorMessage, errCode: error.code || httpStatus[ "500_NAME" ] });
        }
    }
    private getDatasetId(req: Request) {
        let datasetId = req.params.datasetId.trim()
        if (!_.isEmpty(datasetId)) return datasetId
        throw constants.EMPTY_DATASET_ID
    }

    public async getDatasetConfig(datasetId: string) {
        let datasetConfigList = globalCache.get("dataset-config");
        if (!datasetConfigList) await refreshDatasetConfigs();

        datasetConfigList = globalCache.get("dataset-config");
        const datasetRecord = datasetConfigList.find((record: any) => record.id === datasetId);
        // Return record if present in cache
        if (datasetRecord) return datasetRecord;
        else { // Refresh dataset configs cache in case record present in cache
            await refreshDatasetConfigs();
            const datasetConfigList = globalCache.get("dataset-config");
            const datasetRecord = datasetConfigList.find((record: any) => record.id === datasetId);
            return datasetRecord;
        }
    }

    private async getTopic(datasetId: string) {
        const datasetRecord = await this.getDatasetConfig(datasetId);
        if (!datasetRecord) {
            throw constants.DATASET_ID_NOT_FOUND;
        } else {
            return datasetRecord.dataset_config.entry_topic;
        }
    }

}
