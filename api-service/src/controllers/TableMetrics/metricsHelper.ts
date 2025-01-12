import axios from "axios";
import dayjs from "dayjs";
import _ from "lodash";
import { config } from "../../configs/Config";
import { generateTimeseriesQuery, processingTimeQuery, totalEventsQuery, totalFailedEventsQuery } from "./queries";
const druidPort = _.get(config, "query_api.druid.port");
const druidHost = _.get(config, "query_api.druid.host");
const nativeQueryEndpoint = `${druidHost}:${druidPort}${config.query_api.druid.native_query_path}`;

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

    const [totalEventsResponse, totalFailedEventsResponse] = await Promise.all([
        axios.post(nativeQueryEndpoint, totalEventsPayload),
        axios.post(nativeQueryEndpoint, totalFailedEventsPayload)
    ]);

    const totalEventsCount = _.get(totalEventsResponse, "data[0].result.total_events_count", 0);
    const totalFailedEventsCount = _.get(totalFailedEventsResponse, "data[0].result.total_failed_events", 0);
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
            }
        ]
    };
};

export const handleDataVolume = async (dataset_id: string, volume_by_days: number, dateFormat: string) => {
    const currentHourIntervals = dayjs().subtract(1, 'hour').format(dateFormat) + '/' + dayjs().format(dateFormat);
    const currentDayIntervals = dayjs().subtract(1, 'day').startOf('day').format(dateFormat) + '/' + dayjs().endOf('day').format(dateFormat);
    const currentWeekIntervals = dayjs().subtract(1, 'week').startOf('week').format(dateFormat) + '/' + dayjs().endOf('week').format(dateFormat);
    const previousHourIntervals = dayjs().subtract(2, 'hour').format(dateFormat) + '/' + dayjs().subtract(1, 'hour').format(dateFormat);
    const previousDayIntervals = dayjs().subtract(2, 'day').startOf('day').format(dateFormat) + '/' + dayjs().subtract(1, 'day').endOf('day').format(dateFormat);
    const previousWeekIntervals = dayjs().subtract(2, 'week').startOf('week').format(dateFormat) + '/' + dayjs().subtract(1, 'week').endOf('week').format(dateFormat);
    const nDaysIntervals = dayjs().subtract(volume_by_days, 'day').startOf('day').format(dateFormat) + '/' + dayjs().endOf('day').format(dateFormat);

    const currentHourPayload = generateTimeseriesQuery(currentHourIntervals, dataset_id);
    const currentDayPayload = generateTimeseriesQuery(currentDayIntervals, dataset_id);
    const currentWeekPayload = generateTimeseriesQuery(currentWeekIntervals, dataset_id);
    const previousHourPayload = generateTimeseriesQuery(previousHourIntervals, dataset_id);
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

    const currentHourCount = _.get(currentHourResponse, "data[0].result.count", 0);
    const currentDayCount = _.get(currentDayResponse, "data[0].result.count", 0);
    const currentWeekCount = _.get(currentWeekResponse, "data[0].result.count", 0);
    const previousHourCount = _.get(previousHourResponse, "data[0].result.count", 0);
    const previousDayCount = _.get(previousDayResponse, "data[0].result.count", 0);
    const previousWeekCount = _.get(previousWeekResponse, "data[0].result.count", 0);
    const nDaysCount = _.get(nDaysResponse, "data[0].result.count", 0);

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