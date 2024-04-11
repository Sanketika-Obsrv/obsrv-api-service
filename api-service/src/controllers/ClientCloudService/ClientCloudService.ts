import { Request, Response } from 'express';
import { ResponseHandler } from '../../helpers/ResponseHandler';
import httpStatus from 'http-status';
import { getDateRange, isValidDateRange } from '../../utils/common';
import { config as globalConfig } from '../../configs/Config';
import { init as CloudService } from '../../services/CloudServices/index';
import moment from "moment";
import { DateRange } from '../../types/ExhaustModels';
import { getDataset } from '../../services/DatasetService';
import * as _ from "lodash";
import logger from '../../logger';

export class ClientCloudService {
    private cloudProvider: string
    private client: any
    private storage: any
    private config: any
    private momentFormat: string;
    constructor(cloudProvider: string, config?: any) {
        this.cloudProvider = cloudProvider
        this.client = CloudService(this.cloudProvider)
        this.config = config
        this.storage = new this.client(this.config)
        this.momentFormat = "YYYY-MM-DD";
    }

    verifyDatasetExists = async (datasetId: string) => {
        const dataset = await getDataset(datasetId)
        return dataset;
    }

    getFromStorage = async (type: string | undefined, dateRange: DateRange, datasetId: string) => {
        let resData: any = {};
        resData = await this.storage.getFiles(
            globalConfig.exhaust_config.container, globalConfig.exhaust_config.container_prefix, type, dateRange, datasetId,
        )
        return resData;
    }

    getData = async (req: Request, res: Response) => {
        const { params } = req;
        const { datasetId } = params;
        const { type } = req.query;

        if (type && globalConfig.exhaust_config.exclude_exhaust_types.includes(datasetId)) {
            return ResponseHandler.errorResponse({ statusCode: 404, message: "Record not found", errCode: httpStatus["404_NAME"] }, req, res)
        }
        const datasetRecord = await this.verifyDatasetExists(datasetId);
        if (datasetRecord === null) {
            logger.error(`Dataset with ${datasetId} not found in live table`)
            return ResponseHandler.errorResponse({ statusCode: 404, message: "Record not found", errCode: httpStatus["404_NAME"] }, req, res)
        }
        const dateRange = getDateRange(req);
        const isValidDates = isValidDateRange(
            moment(dateRange.from, this.momentFormat),
            moment(dateRange.to, this.momentFormat),
            globalConfig.exhaust_config.maxQueryDateRange,
        );
        if (!isValidDates) {
            logger.error(`Invalid date range! make sure your range cannot be more than ${globalConfig.exhaust_config.maxQueryDateRange} days`)
            return ResponseHandler.errorResponse({ statusCode: 400, message: `Invalid date range! make sure your range cannot be more than ${globalConfig.exhaust_config.maxQueryDateRange} days`, errCode: "BAD_REQUEST" }, req, res)
        }

        const resData: any = await this.getFromStorage(type?.toString(), dateRange, datasetId);
        if (_.isEmpty(resData.files)) {
            logger.error("Date range provided does not have any backup files")
            return ResponseHandler.errorResponse({ statusCode: 404, message: "Date range provided does not have any backup files", errCode: "NOT_FOUND" }, req, res);
        }
        ResponseHandler.successResponse(req, res, { status: 200, data: resData, })
    }
}