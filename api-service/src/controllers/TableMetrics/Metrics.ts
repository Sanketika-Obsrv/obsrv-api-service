import { Request, Response } from "express";
import * as _ from "lodash"
import { ResponseHandler } from "../../helpers/ResponseHandler";
import dayjs from 'dayjs';
import { handleConnectors, handleDataFreshness, handleDataLineage, handleDataObservability, handleDataQuality, handleDataVolume } from "./metricsHelper";
import logger from "../../logger";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./TableMetrics.json";
import { config } from "../../configs/Config";

const apiId = "api.table.metrics";
const tableMetrics = async (req: Request, res: Response) => {
    const { dataset_id } = req.params;
    const msgid = _.get(req, "body.params.msgid");
    const requestBody = req.body;

    const { category, volume_by_days }: any = req.body.request;
    const defaultThreshold = (typeof config?.data_observability?.default_freshness_threshold === 'number' ? config?.data_observability?.default_freshness_threshold : 5) * 60 * 1000; // 5 minutes in milliseconds
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';
    const startDate = '2000-01-01T00:00:00+05:30';
    const endDate = dayjs().add(1, 'day').format(dateFormat);
    const intervals = `${startDate}/${endDate}`;
    const isValidSchema = schemaValidation(requestBody, validationSchema);
    const results = [];
    if (!isValidSchema?.isValid) {
        logger.error({ apiId, datasetId:dataset_id, msgid, requestBody, message: isValidSchema?.message, code: "DATA_OUT_INVALID_INPUT" })
        return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST", code: "DATA_OUT_INVALID_INPUT" }, req, res);
    }

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

        if (!category || category.includes("data_lineage")) {
            const dataLineageResult = await handleDataLineage(dataset_id, intervals);
            results.push(dataLineageResult);
        }

        if (!category || category.includes("connectors")) {
            const connectorsResult = await handleConnectors(dataset_id, intervals);
            results.push(connectorsResult);
        }

        if (!category || category.includes("data_quality")) {
            const connectorsResult = await handleDataQuality(dataset_id, intervals);
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

export default tableMetrics;