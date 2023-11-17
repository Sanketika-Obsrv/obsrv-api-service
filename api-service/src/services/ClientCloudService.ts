import { NextFunction, Request, Response } from 'express';
import { ResponseHandler } from '../helpers/ResponseHandler';
import httpStatus from 'http-status';
import constants from '../resources/Constants.json';
import { ingestorService } from '../routes/Router';
import { getDateRange, isValidDateRange } from '../utils/common';
import { config as globalConfig } from '../configs/Config';
import CloudService from '../lib/client-cloud-services';
import moment from "moment";
import { DateRange } from '../models/ExhaustModels';

export class ClientCloudService {
    private cloudProvider: string
    private client: any
    private storage: any
    private config: any
    private momentFormat: string;
    constructor(cloudProvider: string, config?: any) {
        this.cloudProvider = cloudProvider
        this.client = CloudService.init(this.cloudProvider)
        this.config = config
        this.storage = new this.client(this.config)
        this.momentFormat = "YYYY-MM-DD";
    }

    verifyDatasetExists = async (datasetId: string) => {
        const datasetRecord = await ingestorService.getDatasetConfig(datasetId);
        return datasetRecord;
    }

    getFromStorage = async (type: string | undefined, dateRange: DateRange, datasetId: string) => {
        let resData: any = {};
        resData = await this.storage.getFiles(
            globalConfig.exhaust_config.container, globalConfig.exhaust_config.container_prefix, type, dateRange, datasetId,
        )
        return resData;
    }
    
    getData = async (req: Request, res: Response, next: NextFunction) => {
        const { params } = req;
        const { datasetId } = params;
        const { type } = req.query;
        // Validations
        if(type && globalConfig.exhaust_config.exclude_exhaust_types.includes(type.toString())) {
            next({statusCode: 404, message: constants.RECORD_NOT_FOUND, errCode: httpStatus["404_NAME"],})
            return;
        }
        const datasetRecord = await this.verifyDatasetExists(datasetId);
        if(!datasetRecord) {
            next({statusCode: 404, message: constants.RECORD_NOT_FOUND, errCode: httpStatus["404_NAME"],})
            return;
        }
        const dateRange = getDateRange(req, res);
        const isValidDates = isValidDateRange(
            moment(dateRange.from, this.momentFormat), 
            moment(dateRange.to, this.momentFormat), 
            globalConfig.exhaust_config.maxQueryDateRange,
        );
        if(!isValidDates) {
            next({statusCode: 400, message: constants.ERROR_MESSAGE.INVALID_DATE_RANGE.replace("${allowedRange}", globalConfig.exhaust_config.maxQueryDateRange.toString()), errCode: httpStatus["400_NAME"],})
            return;
        }

        // Fetch Data
        const resData: any = await this.getFromStorage(type?.toString(), dateRange, datasetId);
        if(resData.files.length === 0) {
            next({statusCode: 404, message: constants.EXHAUST.NO_BACKUP_FILES, errCode: httpStatus["404_NAME"],})
            return;
        }
        ResponseHandler.successResponse(req, res, { status: 200, data: resData, })
    }
}
