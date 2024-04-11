import { Request, Response } from 'express';
import { ResponseHandler } from '../../helpers/ResponseHandler';
import httpStatus from 'http-status';
import { getDateRange, isValidDateRange } from '../../utils/common';
import { config } from '../../configs/Config';
import { init } from '../../services/CloudServices/index';
import moment from "moment";
import { getDataset } from '../../services/DatasetService';
import * as _ from "lodash";
import logger from '../../logger';

const cloudProviderName = config.exhaust_config.cloud_storage_provider
const cloudProviderConfig = config.exhaust_config.cloud_storage_config
export const cloudProvider = init(cloudProviderName, cloudProviderConfig);

export const dataExhaust = async (req: Request, res: Response) => {
    const { params } = req;
    const { datasetId } = params;
    const { type }: any = req.query;
    const momentFormat = "YYYY-MM-DD";

    const verifyDatasetExists = async (datasetId: string) => {
        const dataset = await getDataset(datasetId)
        return dataset;
    }

    const getFromStorage = async (type: string, dateRange: any, datasetId: string) => {
        const resData =
            cloudProvider.getFiles(
                config.exhaust_config.container, config.exhaust_config.container_prefix, type, dateRange, datasetId,
            )
        return resData || {};
    }

    if (type && config.exhaust_config.exclude_exhaust_types.includes(datasetId)) {
        return ResponseHandler.errorResponse({ statusCode: 404, message: "Record not found", errCode: httpStatus["404_NAME"] }, req, res)
    }
    const datasetRecord = await verifyDatasetExists(datasetId);
    if (datasetRecord === null) {
        logger.error(`Dataset with ${datasetId} not found in live table`)
        return ResponseHandler.errorResponse({ statusCode: 404, message: "Record not found", errCode: httpStatus["404_NAME"] }, req, res)
    }
    const dateRange = getDateRange(req);
    const isValidDates = isValidDateRange(
        moment(dateRange.from, momentFormat),
        moment(dateRange.to, momentFormat),
        config.exhaust_config.maxQueryDateRange,
    );
    if (!isValidDates) {
        logger.error(`Invalid date range! make sure your range cannot be more than ${config.exhaust_config.maxQueryDateRange} days`)
        return ResponseHandler.errorResponse({ statusCode: 400, message: `Invalid date range! make sure your range cannot be more than ${config.exhaust_config.maxQueryDateRange} days`, errCode: "BAD_REQUEST" }, req, res)
    }

    const resData: any = await getFromStorage(type, dateRange, datasetId);
    if (_.isEmpty(resData.files)) {
        logger.error("Date range provided does not have any backup files")
        return ResponseHandler.errorResponse({ statusCode: 404, message: "Date range provided does not have any backup files", errCode: "NOT_FOUND" }, req, res);
    }
    ResponseHandler.successResponse(req, res, { status: 200, data: resData, })
}