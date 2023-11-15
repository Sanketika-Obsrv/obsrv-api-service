import { Request, Response, NextFunction } from "express";
import constants from "../resources/Constants.json"
import { ResponseHandler } from "../helpers/ResponseHandler";
import _ from 'lodash'
import httpStatus from "http-status";
import { globalCache } from "../routes/Router";
import { refreshDatasetConfigs } from "../helpers/DatasetConfigs";
import { IConnector } from "../models/DatasetModels";
import { wrapperService } from "../routes/Router";
export class IngestorService {
    private kafkaConnector: IConnector;
    constructor(kafkaConnector: IConnector, httpConnector: IConnector,) {
        this.kafkaConnector = kafkaConnector
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

    private handleError(req: Request, res: Response, next: NextFunction, error: any) {
        console.error(error.message)
        next({ 
            statusCode: error.status || httpStatus.INTERNAL_SERVER_ERROR, 
            message: error.message || "", 
            errCode: error.code || httpStatus["500_NAME"] 
        });
    }

    public create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const datasetId = this.getDatasetId(req);
            const validData = await this.validateData(req.body.data, datasetId);
            req.body = { ...req.body.data, dataset: datasetId };
            const topic = await this.getTopic(datasetId);
            await this.kafkaConnector.execute(req, res, topic);
            ResponseHandler.successResponse(req, res, { status: 200, data: { message: constants.DATASET.CREATED } });
        } catch (error: any) { this.handleError(req, res, next, error) }
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
        if (!datasetRecord) throw constants.DATASET_ID_NOT_FOUND;
        return datasetRecord.dataset_config.entry_topic;
    }

    private async validateData(data: any, datasetId: string) {
        const datasetRecord = await this.getDatasetConfig(datasetId);
        if (!datasetRecord) throw constants.DATASET_ID_NOT_FOUND;
        if(_.has(datasetRecord, "extraction_config") && _.get(datasetRecord, ["extraction_config", "is_batch_event"])) {
            if(
                _.has(data, _.get(datasetRecord, ["extraction_config", "extraction_key"])) &&
                _.has(data, _.get(datasetRecord, ["extraction_config", "batch_id"]))
            )
                return data;
            else if (_.has(data, "event"))
                return data;
            else throw constants.INVALID_DATASET_CONFIG;
        } else {
            if(_.has(data, "event"))
                return data;
            else throw constants.INVALID_DATASET_CONFIG;
        }
    }
}
