import { Request, Response } from "express";
import * as _ from "lodash"
import { ResponseHandler } from "../../helpers/ResponseHandler";
import dayjs from 'dayjs';
import logger from "../../logger";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./DatasetMetrics.json";
import { config } from "../../configs/Config";
import { datasetService } from "../../services/DatasetService";
import { getConnectorsData, getDataFreshness, getDataLineage, getDataObservability, getDataVolume, getDownTime } from "../../services/DatasetMetricsService";

const apiId = "api.dataset.metrics";
const datasetMetrics = async (req: Request, res: Response) => {
    const msgid = _.get(req, "body.params.msgid");
    const requestBody = req.body;
    const dataset_id = _.get(req, "body.request.dataset_id");
    const timePeriod = _.get(req, "body.request.query_time_period") || config?.data_observability?.default_query_time_period;
    const input_start_date = _.get(req, "body.request.start_date");
    const input_end_date = _.get(req, "body.request.end_date");
    const max_down_time_period = _.get(req, "body.request.max_down_time_period") || config?.data_observability?.default_down_time_period;
    const formattedStartDate = dayjs(input_start_date, 'YYYY/M/D')
        .startOf('day')
        .format('YYYY-MM-DDTHH:mm:ss');

    const formattedEndDate = dayjs(input_end_date, 'YYYY/M/D')
        .endOf('day')
        .format('YYYY-MM-DDTHH:mm:ss');

    if (input_start_date && input_end_date) {
        if (dayjs(formattedStartDate).isAfter(dayjs(formattedEndDate))) {
            logger.error({ apiId, datasetId: dataset_id, msgid, message: "Start date cannot be greater than end date", code: "INVALID_DATE_RANGE" });
            return ResponseHandler.errorResponse({
                message: "Invalid date range",
                statusCode: 400,
                errCode: "BAD_REQUEST",
                code: "INVALID_DATE_RANGE"
            }, req, res);
        }
    }

    if (input_end_date && input_start_date && dayjs(formattedEndDate).isAfter(dayjs())) {
        logger.error({ apiId, datasetId: dataset_id, msgid, message: "End date cannot be greater than the current date", code: "INVALID_DATE_RANGE" });
        return ResponseHandler.errorResponse({
            message: "Invalid date range: End date cannot be in the future",
            statusCode: 400,
            errCode: "BAD_REQUEST",
            code: "INVALID_DATE_RANGE"
        }, req, res);
    }

    const { category }: any = req.body.request;
    const defaultThreshold = (typeof config?.data_observability?.default_freshness_threshold === 'number' ? config?.data_observability?.default_freshness_threshold : 5) * 60 * 1000; // 5 minutes in milliseconds
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';
    const endDate = dayjs().format(dateFormat);
    const startDate = dayjs(endDate).subtract(timePeriod, 'day').format(dateFormat);
    const intervals = (input_start_date && input_end_date) ? `${formattedStartDate}/${formattedEndDate}` : `${startDate}/${endDate}`;
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
            const dataFreshnessResult = await getDataFreshness(dataset_id, intervals, defaultThreshold, timePeriod);
            results.push(dataFreshnessResult);
        }

        if (!category || category.includes("data_observability")) {
            const dataObservabilityResult = await getDataObservability(dataset_id, intervals, timePeriod);
            results.push(dataObservabilityResult);
        }

        if (!category || category.includes("data_volume")) {
            const dataVolumeResult = await getDataVolume(dataset_id, intervals, dateFormat, timePeriod);
            results.push(dataVolumeResult);
        }

        if (!category || category.includes("data_lineage")) {
            const dataLineageResult = await getDataLineage(dataset_id, intervals, timePeriod);
            results.push(dataLineageResult);
        }

        if (!category || category.includes("connectors")) {
            const connectorsResult = await getConnectorsData(dataset_id, intervals);
            results.push(connectorsResult);
        }

        if (!category || category.includes("down_time")) {
            const downTimeResults = await getDownTime(dataset_id, timePeriod, max_down_time_period);
            results.push(downTimeResults);
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