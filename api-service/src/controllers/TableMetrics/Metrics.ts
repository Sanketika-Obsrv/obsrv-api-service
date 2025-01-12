import { Request, Response } from "express";
import * as _ from "lodash"
import { ResponseHandler } from "../../helpers/ResponseHandler";
import dayjs from 'dayjs';
import { handleDataFreshness, handleDataObservability, handleDataVolume } from "./metricsHelper";
import logger from "../../logger";

const apiId = "api.table.metrics";
const tableMetrics = async (req: Request, res: Response) => {
    const { dataset_id } = req.params;
    const msgid = _.get(req, "body.params.msgid");
    const requestBody = req.body;

    const { category, volume_by_days }: any = req.body.request;
    const defaultThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds read from env
    const dateFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    const startDate = '2000-01-01T00:00:00+05:30';
    const endDate = dayjs().add(1, 'day').format(dateFormat);
    const intervals = `${startDate}/${endDate}`;

    const results = [];

    try {
        if (!category || category.includes("data_freshness")) {
            const dataFreshnessResult = await handleDataFreshness(dataset_id, intervals, defaultThreshold);
            results.push(dataFreshnessResult);
        }

        if (!category || category.includes("data_observability")) {
            const dataObservabilityResult = await handleDataObservability(dataset_id, intervals);
            results.push(dataObservabilityResult);
        }

        if (!category || category.includes("data_volume")) {
            const dataVolumeResult = await handleDataVolume(dataset_id, volume_by_days, dateFormat);
            results.push(dataVolumeResult);
        }
        logger.info({ apiId, msgid, requestBody, datasetId: dataset_id, message: "Metrics fetched successfully" })
        return ResponseHandler.successResponse(req, res, { status: 200, data: results });
    } catch (error: any) {
        logger.error({ apiId, msgid, requestBody: req?.body, datasetId: dataset_id, message: "Error while fetching metrics", code: "FAILED_TO_FETCH_METRICS" });
        return ResponseHandler.errorResponse({ message: "Error while fetching metrics", statusCode: 500, errCode: "FAILED", code: "FAILED_TO_FETCH_METRICS" }, req, res);
    }

}

export default tableMetrics;