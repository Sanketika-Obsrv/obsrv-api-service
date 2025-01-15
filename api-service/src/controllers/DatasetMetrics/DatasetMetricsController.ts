import { Request, Response } from "express";
import * as _ from "lodash"
import { ResponseHandler } from "../../helpers/ResponseHandler";
import dayjs from 'dayjs';
import logger from "../../logger";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./DatasetMetrics.json";
import { config } from "../../configs/Config";
import { datasetService } from "../../services/DatasetService";
import { getConnectors, getDataFreshness, getDataLineage, getDataObservability, getDataQuality, getDataVolume } from "../../services/DatasetMetricsService";

const apiId = "api.dataset.metrics";
const datasetMetrics = async (req: Request, res: Response) => {
    const msgid = _.get(req, "body.params.msgid");
    const requestBody = req.body;
    const dataset_id = _.get(req, "body.request.dataset_id");
    const startDateValue = _.get(req, "body.request.start_date") || config?.data_observability?.default_query_time_period;

    const { category, volume_by_days = 10 }: any = req.body.request;
    const defaultThreshold = (typeof config?.data_observability?.default_freshness_threshold === 'number' ? config?.data_observability?.default_freshness_threshold : 5) * 60 * 1000; // 5 minutes in milliseconds
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';
    const endDate = dayjs().format(dateFormat);
    const startDate = dayjs(endDate).subtract(startDateValue, 'day').format(dateFormat);
    const intervals = `${startDate}/${endDate}`;
    const isValidSchema = schemaValidation(requestBody, validationSchema);
    const results = [];

    if (!isValidSchema?.isValid) {
        logger.error({ apiId, datasetId: dataset_id, msgid, requestBody, message: isValidSchema?.message, code: "DATA_OUT_INVALID_INPUT" })
        return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST", code: "DATA_OUT_INVALID_INPUT" }, req, res);
    }

    const dataset = await datasetService.getDataset(dataset_id, ["id"], true)
    if (!dataset) {
        logger.error({ apiId, message: `Dataset with id ${dataset_id} not found in live table`, code: "DATASET_NOT_FOUND" })
        return ResponseHandler.errorResponse({ message: `Dataset with id ${dataset_id} not found in live table`, code: "DATASET_NOT_FOUND", statusCode: 404, errCode: "NOT_FOUND" }, req, res);
    }

    try {
        if (!category || category.includes("data_freshness")) {
            const dataFreshnessResult = await getDataFreshness(dataset_id, intervals, defaultThreshold);
            results.push(dataFreshnessResult);
        }

        if (!category || category.includes("data_observability")) {
            const dataObservabilityResult = await getDataObservability(dataset_id, intervals);
            results.push(dataObservabilityResult);
        }

        if (!category || category.includes("data_volume")) {
            const dataVolumeResult = await getDataVolume(dataset_id, volume_by_days, dateFormat);
            results.push(dataVolumeResult);
        }

        if (!category || category.includes("data_lineage")) {
            const dataLineageResult = await getDataLineage(dataset_id, intervals);
            results.push(dataLineageResult);
        }

        if (!category || category.includes("connectors")) {
            const connectorsResult = await getConnectors(dataset_id, intervals);
            results.push(connectorsResult);
        }

        if (!category || category.includes("data_quality")) {
            const connectorsResult = await getDataQuality(dataset_id, intervals);
            results.push(connectorsResult);
        }

        logger.info({ apiId, msgid, requestBody, datasetId: dataset_id, message: "Metrics fetched successfully" })
        return ResponseHandler.successResponse(req, res, { status: 200, data: results });

    }
    catch (error: any) {
        logger.error({ apiId, msgid, requestBody: req?.body, datasetId: dataset_id, message: "Error while fetching metrics", code: "FAILED_TO_FETCH_METRICS", error });
        return ResponseHandler.errorResponse({ message: "Error while fetching metrics", statusCode: 500, errCode: "FAILED", code: "FAILED_TO_FETCH_METRICS" }, req, res);
    }

}

export default datasetMetrics;