import axios from "axios";
import dayjs from "dayjs";
import _ from "lodash";
import { config } from "../../configs/Config";
import { dataLineageSuccessQuery, generateConnectorQuery, generateDatasetQueryCallsQuery, generateDedupFailedQuery, generateDenormFailedQuery, generateTimeseriesQuery, generateTimeseriesQueryEventsPerHour, generateTotalQueryCallsQuery, generateTransformationFailedQuery, processingTimeQuery, totalEventsQuery, totalFailedEventsQuery } from "./queries";
const druidPort = _.get(config, "query_api.druid.port");
const druidHost = _.get(config, "query_api.druid.host");
const nativeQueryEndpoint = `${druidHost}:${druidPort}${config.query_api.druid.native_query_path}`;
const prometheusEndpoint = `${config.query_api.prometheus.url}/api/v1/query_range`;

export const handleDataFreshness = async (dataset_id: string, intervals: string, defaultThreshold: number) => {
    const queryPayload = processingTimeQuery(intervals, dataset_id);
    const druidResponse = await axios.post(nativeQueryEndpoint, queryPayload?.query);
    const avgProcessingTime = _.get(druidResponse, "data[0].average_processing_time", 0);
    const freshnessStatus = avgProcessingTime < defaultThreshold ? "Healthy" : "Unhealthy";

    return {
        category: "data_freshness",
        status: freshnessStatus,
        components: [
            {
                type: "average_time_difference_in_min",
                threshold: defaultThreshold / 60000, // convert to minutes
                value: avgProcessingTime / 60000,
                status: freshnessStatus
            },
            {
                type: "freshness_query_time_in_min",
                threshold: 10,
                value: avgProcessingTime / 60000, // convert to minutes
                status: freshnessStatus
            }
        ]
    };
};

export const handleDataObservability = async (dataset_id: string, intervals: string) => {
    const totalEventsPayload = totalEventsQuery(intervals, dataset_id);
    const totalFailedEventsPayload = totalFailedEventsQuery(intervals, dataset_id);
    const totalQueryCalls = generateTotalQueryCallsQuery(config?.data_out_query_time_period);
    const totalQueryCallsAtDatasetLevel = generateDatasetQueryCallsQuery(dataset_id, config?.data_out_query_time_period);

    const [totalEventsResponse, totalFailedEventsResponse, totalApiCallsResponse, totalCallsAtDatasetLevelResponse] = await Promise.all([
        axios.post(nativeQueryEndpoint, totalEventsPayload),
        axios.post(nativeQueryEndpoint, totalFailedEventsPayload),
        axios.request({ url: prometheusEndpoint, method: "GET", params: totalQueryCalls }),
        axios.request({ url: prometheusEndpoint, method: "GET", params: totalQueryCallsAtDatasetLevel })
    ]);

    const totalApiCalls = _.map(_.get(totalApiCallsResponse, 'data.data.result'), payload => {
        return _.floor(_.get(payload, 'values[0][1]'), 3) || 0
    })

    const totalApiCallsAtDatasetLevel = _.map(_.get(totalCallsAtDatasetLevelResponse, 'data.data.result'), payload => {
        return _.floor(_.get(payload, 'values[0][1]'), 3) || 0
    })

    const importanceScore = (totalApiCallsAtDatasetLevel[0] / totalApiCalls[0]) * 100;

    const totalEventsCount = _.get(totalEventsResponse, "data[0].result.total_events_count") || 0;
    const totalFailedEventsCount = _.get(totalFailedEventsResponse, "data[0].result.total_failed_events") || 0;
    let failurePercentage = 0;
    if (totalEventsCount > 0) {
        failurePercentage = (totalFailedEventsCount / totalEventsCount) * 100;
    }
    const observabilityStatus = failurePercentage > 5 ? "Unhealthy" : "Healthy";

    return {
        category: "data_observability",
        status: observabilityStatus,
        components: [
            {
                type: "data_observability_health",
                status: observabilityStatus
            },
            {
                type: "failure_percentage",
                value: failurePercentage
            },
            {
                type: "threshold_percentage",
                value: 5
            },
            {
                type: "importance_score",
                value: importanceScore
            }
        ]
    };
};

export const handleDataVolume = async (dataset_id: string, volume_by_days: number, dateFormat: string) => {
    const currentHourIntervals = dayjs().subtract(1, "hour").startOf("hour").toISOString() + "/" + dayjs().startOf("hour").toISOString();
    const currentDayIntervals = dayjs().subtract(1, 'day').startOf('day').format(dateFormat) + '/' + dayjs().endOf('day').format(dateFormat);
    const currentWeekIntervals = dayjs().subtract(1, 'week').startOf('week').format(dateFormat) + '/' + dayjs().endOf('week').format(dateFormat);
    const previousHourIntervals = dayjs().subtract(2, "hour").startOf("hour").toISOString() + '/' + dayjs().startOf("hour").toISOString();
    const previousDayIntervals = dayjs().subtract(2, 'day').startOf('day').format(dateFormat) + '/' + dayjs().subtract(1, 'day').endOf('day').format(dateFormat);
    const previousWeekIntervals = dayjs().subtract(2, 'week').startOf('week').format(dateFormat) + '/' + dayjs().subtract(1, 'week').endOf('week').format(dateFormat);
    const nDaysIntervals = dayjs().subtract(volume_by_days, 'day').startOf('day').format(dateFormat) + '/' + dayjs().endOf('day').format(dateFormat);

    const currentHourPayload = generateTimeseriesQueryEventsPerHour(currentHourIntervals, dataset_id);
    const currentDayPayload = generateTimeseriesQuery(currentDayIntervals, dataset_id);
    const currentWeekPayload = generateTimeseriesQuery(currentWeekIntervals, dataset_id);
    const previousHourPayload = generateTimeseriesQueryEventsPerHour(previousHourIntervals, dataset_id);
    const previousDayPayload = generateTimeseriesQuery(previousDayIntervals, dataset_id);
    const previousWeekPayload = generateTimeseriesQuery(previousWeekIntervals, dataset_id);
    const nDaysPayload = generateTimeseriesQuery(nDaysIntervals, dataset_id);
    const [
        currentHourResponse, currentDayResponse, currentWeekResponse,
        previousHourResponse, previousDayResponse, previousWeekResponse,
        nDaysResponse
    ] = await Promise.all([
        axios.post(nativeQueryEndpoint, currentHourPayload),
        axios.post(nativeQueryEndpoint, currentDayPayload),
        axios.post(nativeQueryEndpoint, currentWeekPayload),
        axios.post(nativeQueryEndpoint, previousHourPayload),
        axios.post(nativeQueryEndpoint, previousDayPayload),
        axios.post(nativeQueryEndpoint, previousWeekPayload),
        axios.post(nativeQueryEndpoint, nDaysPayload)
    ]);
    const currentHourCount = _.get(currentHourResponse, "data[0].result.count") || 0;
    const currentDayCount = _.get(currentDayResponse, "data[0].result.count") || 0;
    const currentWeekCount = _.get(currentWeekResponse, "data[0].result.count") || 0;
    const previousHourCount = _.get(previousHourResponse, "data[0].result.count") || 0;
    const previousDayCount = _.get(previousDayResponse, "data[0].result.count") || 0;
    const previousWeekCount = _.get(previousWeekResponse, "data[0].result.count") || 0;
    const nDaysCount = _.get(nDaysResponse, "data[0].result.count") || 0;

    const volumePercentageByHour = previousHourCount > 0 ? ((currentHourCount - previousHourCount) / previousHourCount) * 100 : 0;
    const volumePercentageByDay = previousDayCount > 0 ? ((currentDayCount - previousDayCount) / previousDayCount) * 100 : 0;
    const volumePercentageByWeek = previousWeekCount > 0 ? ((currentWeekCount - previousWeekCount) / previousWeekCount) * 100 : 0;

    return {
        category: "data_volume",
        components: [
            { type: "events_per_hour", value: currentHourCount },
            { type: "events_per_day", value: currentDayCount },
            { type: "events_per_n_day", value: nDaysCount },
            { type: "volume_percentage_by_hour", value: volumePercentageByHour },
            { type: "volume_percentage_by_day", value: volumePercentageByDay },
            { type: "volume_percentage_by_week", value: volumePercentageByWeek },
            { type: "growth_rate_percentage", value: volumePercentageByHour } // Assuming growth rate is same as volume percentage by hour
        ]
    };
};

export const handleDataLineage = async (dataset_id: string, intervals: string) => {
    const transformationSuccessPayload = dataLineageSuccessQuery(intervals, dataset_id, "transformer_status", "success");
    const dedupSuccessPayload = dataLineageSuccessQuery(intervals, dataset_id, "dedup_status", "success");
    const denormSuccessPayload = dataLineageSuccessQuery(intervals, dataset_id, "denorm_status", "success");
    const totalValidationPayload = dataLineageSuccessQuery(intervals, dataset_id, "ctx_dataset", dataset_id);
    const totalValidationFailedPayload = dataLineageSuccessQuery(intervals, dataset_id, "error_pdata_status", "failed");
    const transformationFailedPayload = generateTransformationFailedQuery(intervals, dataset_id);
    const dedupFailedPayload = generateDedupFailedQuery(intervals, dataset_id);
    const denormFailedPayload = generateDenormFailedQuery(intervals, dataset_id);

    const [
        transformationSuccessResponse, dedupSuccessResponse, denormSuccessResponse,
        totalValidationResponse, totalValidationFailedResponse, transformationFailedResponse, dedupFailedResponse, denormFailedResponse
    ] = await Promise.all([
        axios.post(nativeQueryEndpoint, transformationSuccessPayload),
        axios.post(nativeQueryEndpoint, dedupSuccessPayload),
        axios.post(nativeQueryEndpoint, denormSuccessPayload),
        axios.post(nativeQueryEndpoint, totalValidationPayload),
        axios.post(nativeQueryEndpoint, totalValidationFailedPayload),
        axios.post(nativeQueryEndpoint, transformationFailedPayload),
        axios.post(nativeQueryEndpoint, dedupFailedPayload),
        axios.post(nativeQueryEndpoint, denormFailedPayload)
    ]);

    // success at each level
    const transformationSuccessCount = _.get(transformationSuccessResponse, "data[0].result.count") || 0;
    const dedupSuccessCount = _.get(dedupSuccessResponse, "data[0].result.count") || 0;
    const denormSuccessCount = _.get(denormSuccessResponse, "data[0].result.count") || 0;
    const totalValidationCount = _.get(totalValidationResponse, "data[0].result.count") || 0;
    const totalValidationFailedCount = _.get(totalValidationFailedResponse, "data[0].result.count") || 0;
    const storageSuccessCount = totalValidationCount - totalValidationFailedCount;

    // failure at each level
    const transformationFailedCount = _.get(transformationFailedResponse, "data[0].result.count") || 0;
    const dedupFailedCount = _.get(dedupFailedResponse, "data[0].result.count") || 0;
    const denormFailedCount = _.get(denormFailedResponse, "data[0].result.count") || 0;
    return {
        category: "data_lineage",
        components: [
            { type: "transformation_success", value: transformationSuccessCount },
            { type: "dedup_success", value: dedupSuccessCount },
            { type: "denormalization_success", value: denormSuccessCount },
            { type: "total_success", value: storageSuccessCount },
            { type: "total_failed", value: totalValidationFailedCount },
            { type: "transformation_failed", value: transformationFailedCount },
            { type: "dedup_failed", value: dedupFailedCount },
            { type: "denorm_failed", value: denormFailedCount }
        ]
    };
};


export const handleConnectors = async (dataset_id: string, intervals: string) => {
    const connectorQueryPayload = generateConnectorQuery(intervals, dataset_id);
    const connectorResponse = await axios.post(nativeQueryEndpoint, connectorQueryPayload);
    const connectorsData = _.get(connectorResponse, "data[0].result", []);
    const result = {
        category: "connectors",
        components: connectorsData.map((item: any) => ({
            id: item.name || "failed",
            type: item.name === null ? "failed" : "success",
            value: item.count
        }))
    };

    return {
        category: "connectors",
        components: result
    };
};

export const handleDataQuality = async (dataset_id: string, intervals: string) => {
    const totalValidationPayload = dataLineageSuccessQuery(intervals, dataset_id, "ctx_dataset", dataset_id);
    const totalValidationFailedPayload = dataLineageSuccessQuery(intervals, dataset_id, "error_pdata_status", "failed");
    const [totalValidationResponse, totalValidationFailedResponse,
    ] = await Promise.all([
        axios.post(nativeQueryEndpoint, totalValidationPayload),
        axios.post(nativeQueryEndpoint, totalValidationFailedPayload),
    ]);
    const totalValidationCount = _.get(totalValidationResponse, "data[0].result.count") || 0;
    const totalValidationFailedCount = _.get(totalValidationFailedResponse, "data[0].result.count") || 0;
    const storageSuccessCount = totalValidationCount - totalValidationFailedCount;

    return {
        category: "data_quality",
        "components": [
            { type: "incidents_failed", value: totalValidationFailedCount },
            { type: "incidents_success", value: storageSuccessCount },
            { type: "total_incidents", value: totalValidationCount }
        ]
    };
}