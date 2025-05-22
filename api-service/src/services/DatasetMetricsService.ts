import axios from "axios";
import dayjs from "dayjs";
import _ from "lodash";
import { config } from "../configs/Config";
import { dataLineageSuccessQuery, extractorBatchDuplicateCountQuery, extractorSuccessCountQuery, generateConnectorQuery, generateDatasetQueryCallsQuery, generateDedupFailedQuery, generateDenormFailedQuery, generateTimeseriesQuery, generateTotalQueryCallsQuery, generateTransformationFailedQuery, processingTimeQuery, totalEventsQuery, totalFailedEventsQuery } from "../controllers/DatasetMetrics/queries";
import { getDownTimeContainers } from "../configs/DataObsrvDefaults";
import { datasetService } from "../services/DatasetService";
const druidPort = _.get(config, "query_api.druid.port");
const druidHost = _.get(config, "query_api.druid.host");
const nativeQueryEndpoint = `${druidHost}:${druidPort}${config.query_api.druid.native_query_path}`;
const prometheusEndpoint = `${config.query_api.prometheus.url}/api/v1/query_range`;
const prometheusQueryEndpoint = `${config.query_api.prometheus.url}/api/v1/query`;

export const getDataFreshness = async (dataset_id: string, intervals: string, defaultThreshold: number, timePeriod: any) => {
    const queryPayload = processingTimeQuery(intervals, dataset_id, timePeriod);
    const druidResponse = await axios.post(nativeQueryEndpoint, queryPayload?.query);
    const dates = [];
    const statusArray = [];

    if (timePeriod === 1) {
        const endTime = dayjs();
        const startTime = endTime.subtract(24, 'hours');

        // Create a map of existing data for hourly
        const dataMap = new Map(
            druidResponse.data.map((item: any) => [
                dayjs(item.timestamp).format('YYYY-MM-DDTHH:00:00.000Z'),
                item.event.average_processing_time || 0
            ])
        );

        // Fill in all hours
        for (let i = 0; i < 24; i++) {
            const currentHour = startTime.add(i + 1, 'hour');
            const timestamp = currentHour.format('YYYY-MM-DDTHH:00:00.000Z');
            const processingTime: any = dataMap.get(timestamp) || 0;

            let status = "Data not found";
            let reason = "Data not found";

            if (processingTime > 0) {
                status = processingTime < defaultThreshold ? "Healthy" : "Unhealthy";
                reason = status === "Unhealthy" ? "Processing time is higher than configured threshold" : "";
            }

            dates.push({
                timestamp,
                average_processing_time: processingTime
            });

            statusArray.push({
                timeStamp: currentHour.valueOf(),
                status: status,
                reason: reason
            });
        }
    } else {
        // Handle day-level data
        const [startDate, endDate] = intervals.split('/');
        let currentDate = dayjs(startDate).startOf('day');
        const lastDate = dayjs(endDate).startOf('day');

        // Create a map of existing data for daily
        const dataMap = new Map(
            druidResponse.data.map((item: any) => [
                dayjs(item.timestamp).format('YYYY-MM-DD'),
                item.event.average_processing_time || 0
            ])
        );

        // Fill in all days
        while (currentDate.isBefore(lastDate)) {
            const dateStr = currentDate.format('YYYY-MM-DD');
            const processingTime: any = dataMap.get(dateStr) || 0;

            let status = "Data not found";
            let reason = "Data not found";

            if (processingTime > 0) {
                status = processingTime < defaultThreshold ? "Healthy" : "Unhealthy";
                reason = status === "Unhealthy" ? "Processing time is higher than configured threshold" : "";
            }

            dates.push({
                timestamp: `${dateStr}T00:00:00.000Z`,
                average_processing_time: processingTime
            });

            statusArray.push({
                timeStamp: currentDate.valueOf(),
                status: status,
                reason: reason
            });

            currentDate = currentDate.add(1, 'day');
        }
    }

    return {
        category: "data_freshness",
        status: statusArray
    };
};

export const getDataObservability = async (dataset_id: string, intervals: string, time_period: any) => {
    const totalEventsPayload = totalEventsQuery(intervals, dataset_id, time_period);
    const totalFailedEventsPayload = totalFailedEventsQuery(intervals, dataset_id, time_period);

    const totalQueryCalls = generateTotalQueryCallsQuery(time_period ? `${time_period}d` : config?.data_observability?.data_out_query_time_period);
    const totalQueryCallsAtDatasetLevel = generateDatasetQueryCallsQuery(dataset_id, time_period ? `${time_period}d` : config?.data_observability?.data_out_query_time_period);

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

    if (time_period === 1) {
        const statusArray = [];
        const endTime = dayjs();
        const startTime = endTime.subtract(24, 'hours');

        // Create maps for events and failed events
        const eventsMap = new Map(
            totalEventsResponse.data.map((item: any) => [
                dayjs(item.timestamp).format('YYYY-MM-DDTHH:00:00.000Z'),
                item.result.total_events_count || 0
            ])
        );

        const failedEventsMap = new Map(
            totalFailedEventsResponse.data.map((item: any) => [
                dayjs(item.timestamp).format('YYYY-MM-DDTHH:00:00.000Z'),
                item.result.total_failed_events || 0
            ])
        );

        // Fill in all hours
        for (let i = 0; i < 24; i++) {
            const currentHour = startTime.add(i + 1, 'hour');
            const timestamp = currentHour.format('YYYY-MM-DDTHH:00:00.000Z');

            const totalEvents: any = eventsMap.get(timestamp) || 0;
            const failedEvents: any = failedEventsMap.get(timestamp) || 0;

            let status = "Data not found";
            let reason = "Data not found";

            if (totalEvents > 0) {
                const failurePercentage = (failedEvents / totalEvents) * 100;
                status = failurePercentage > 5 ? "Unhealthy" : "Healthy";
                reason = status === "Unhealthy" ? "High events failure rate detected is higher than threshold" : "No issues reported";
            }

            statusArray.push({
                timeStamp: currentHour.valueOf(),
                status: status,
                reason: reason
            });
        }

        // Calculate overall metrics for components
        const totalEventsCount: any = Array.from(eventsMap.values()).reduce((sum: any, count) => sum + count, 0);
        const totalFailedEventsCount: any = Array.from(failedEventsMap.values()).reduce((sum: any, count) => sum + count, 0);
        let overallFailurePercentage = 0;
        if (totalEventsCount > 0) {
            overallFailurePercentage = (totalFailedEventsCount / totalEventsCount) * 100;
        }
        const observabilityStatus = overallFailurePercentage > 5 ? "Unhealthy" : "Healthy";

        return {
            category: "data_observability",
            status: statusArray,
            components: [
                {
                    type: "data_observability_health",
                    status: observabilityStatus
                },
                {
                    type: "failure_percentage",
                    value: overallFailurePercentage
                },
                {
                    type: "threshold_percentage",
                    value: 5
                },
                {
                    type: "importance_score",
                    value: importanceScore || 0
                }
            ]
        };
    }

    // Handle day-level data
    const statusArray = [];
    const [startDate, endDate] = intervals.split('/');
    let currentDate = dayjs(startDate).startOf('day');
    const lastDate = dayjs(endDate).startOf('day');

    // Create maps for daily events and failed events
    const eventsMap = new Map(
        totalEventsResponse.data.map((item: any) => [
            dayjs(item.timestamp).format('YYYY-MM-DD'),
            item.result.total_events_count || 0
        ])
    );

    const failedEventsMap = new Map(
        totalFailedEventsResponse.data.map((item: any) => [
            dayjs(item.timestamp).format('YYYY-MM-DD'),
            item.result.total_failed_events || 0
        ])
    );

    // Fill in all days
    while (currentDate.isBefore(lastDate)) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        const totalEvents: any = eventsMap.get(dateStr) || 0;
        const failedEvents: any = failedEventsMap.get(dateStr) || 0;

        let status = "Data not found";
        let reason = "Data not found";

        if (totalEvents > 0) {
            const failurePercentage = (failedEvents / totalEvents) * 100;
            status = failurePercentage > 5 ? "Unhealthy" : "Healthy";
            reason = status === "Unhealthy" ? "Events failure rate is higher than threshold" : "No issues reported";
        }

        statusArray.push({
            timeStamp: currentDate.valueOf(),
            status: status,
            reason: reason
        });

        currentDate = currentDate.add(1, 'day');
    }

    // Calculate overall metrics
    const totalEventsCount: any = Array.from(eventsMap.values()).reduce((sum: any, count) => sum + count, 0);
    const totalFailedEventsCount: any = Array.from(failedEventsMap.values()).reduce((sum: any, count) => sum + count, 0);

    let overallFailurePercentage = 0;
    if (totalEventsCount > 0) {
        overallFailurePercentage = (totalFailedEventsCount / totalEventsCount) * 100;
    }
    const observabilityStatus = overallFailurePercentage > 5 ? "Unhealthy" : "Healthy";

    return {
        category: "data_observability",
        status: statusArray,
        components: [
            {
                type: "data_observability_health",
                status: observabilityStatus
            },
            {
                type: "failure_percentage",
                value: overallFailurePercentage
            },
            {
                type: "threshold_percentage",
                value: 5
            },
            {
                type: "importance_score",
                value: importanceScore || 0
            }
        ]
    };
};

export const getDataVolume = async (dataset_id: string, interval: string, dateFormat: string, timePeriod: any) => {
    const payload = generateTimeseriesQuery(interval, dataset_id, timePeriod);
    const [dataResponse] = await Promise.all([
        axios.post(nativeQueryEndpoint, payload),
    ]);
    // Handle hourly data when timePeriod is 1 (24hrs)
    if (timePeriod === 1) {
        const dates = [];
        const endTime = dayjs();
        const startTime = endTime.subtract(24, 'hours');

        // Calculate total count for current 24 hours
        const currentPeriodTotal = dataResponse.data.reduce((sum: number, item: any) => {
            return sum + (item.result.count || 0);
        }, 0);

        // Get previous 24 hours interval
        const previousEndTime = startTime;
        const previousStartTime = previousEndTime.subtract(24, 'hours');
        const previousInterval = `${previousStartTime.format('YYYY-MM-DDTHH:mm:ss')}/${previousEndTime.format('YYYY-MM-DDTHH:mm:ss')}`;

        // Fetch previous period data
        const previousPayload = generateTimeseriesQuery(previousInterval, dataset_id, timePeriod);
        const previousResponse = await axios.post(nativeQueryEndpoint, previousPayload);

        // Calculate total count for previous 24 hours
        const previousPeriodTotal = previousResponse.data.reduce((sum: number, item: any) => {
            return sum + (item.result.count || 0);
        }, 0);

        // Calculate percentage change with modified logic
        const percentageChange = previousPeriodTotal === 0
            ? (currentPeriodTotal > 0 ? 100 : 0)
            : ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100;

        // Create hourly data array with existing logic
        const dataMap = new Map(
            dataResponse.data.map((item: any) => [
                dayjs(item.timestamp).format('YYYY-MM-DDTHH:00:00.000Z'),
                item.result.count
            ])
        );

        for (let i = 0; i < 24; i++) {
            const currentHour = startTime.add(i + 1, 'hour');
            const timestamp = currentHour.format('YYYY-MM-DDTHH:00:00.000Z');
            dates.push({
                timestamp,
                result: { count: dataMap.get(timestamp) || null }
            });
        }

        return {
            category: "data_volume",
            components: [
                { type: "volume", value: dates },
                { type: "volume_percentage", value: _.round(percentageChange, 2) }
            ]
        };
    }

    // Original code for non-hourly data
    const [startDate, endDate] = interval.split('/');
    const dates = [];
    let currentDate = dayjs(startDate).startOf('day');
    const lastDate = dayjs(endDate).startOf('day');

    // Calculate total count for current period
    const currentPeriodTotal = dataResponse.data.reduce((sum: number, item: any) => {
        return sum + (item.result.count || 0);
    }, 0);

    // Get previous period interval
    const currentStartDate = dayjs(startDate);
    const previousEndDate = currentStartDate;
    const previousStartDate = previousEndDate.subtract(timePeriod, 'days');
    const previousInterval = `${previousStartDate.format('YYYY-MM-DDTHH:mm:ss')}/${previousEndDate.format('YYYY-MM-DDTHH:mm:ss')}`;

    // Fetch previous period data
    const previousPayload = generateTimeseriesQuery(previousInterval, dataset_id, timePeriod);
    const previousResponse = await axios.post(nativeQueryEndpoint, previousPayload);

    // Calculate total count for previous period
    const previousPeriodTotal = previousResponse.data.reduce((sum: number, item: any) => {
        return sum + (item.result.count || 0);
    }, 0);

    // Calculate percentage change
    const percentageChange = previousPeriodTotal === 0
        ? (currentPeriodTotal > 0 ? 100 : 0)
        : ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100;

    // Create a map of existing data
    const dataMap = new Map(
        dataResponse.data.map((item: any) => [
            dayjs(item.timestamp).format('YYYY-MM-DD'),
            item.result.count
        ])
    );

    // Fill in all dates
    while (currentDate.isBefore(lastDate) || currentDate.isSame(lastDate, 'day')) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        dates.push({
            timestamp: `${dateStr}T00:00:00.000Z`,
            result: { count: dataMap.get(dateStr) || null }
        });
        currentDate = currentDate.add(1, 'day');
    }

    return {
        category: "data_volume",
        components: [
            { type: "volume", value: dates },
            { type: "volume_percentage", value: _.round(percentageChange, 2) }
        ]
    };
};

export const getDataLineage = async (dataset_id: any, intervals: string, time_period: any) => {
    const datasetId = dataset_id.replaceAll("-", "_"); // for promql
    const transformationSuccessPayload = dataLineageSuccessQuery(intervals, dataset_id, "transformer_status", "success");
    const dedupSuccessPayload = dataLineageSuccessQuery(intervals, dataset_id, "dedup_status", "success");
    const denormSuccessPayload = dataLineageSuccessQuery(intervals, dataset_id, "denorm_status", "success");
    const totalValidationPayload = dataLineageSuccessQuery(intervals, dataset_id, "ctx_dataset", dataset_id);
    const totalValidationFailedPayload = dataLineageSuccessQuery(intervals, dataset_id, "error_pdata_status", "failed");
    const transformationFailedPayload = generateTransformationFailedQuery(intervals, dataset_id);
    const dedupFailedPayload = generateDedupFailedQuery(datasetId, `${time_period}d`);
    const denormFailedPayload = generateDenormFailedQuery(intervals, dataset_id);
    const extractorSuccessCountPayload = extractorSuccessCountQuery(datasetId, `${time_period}d`);
    const extractorBatchDuplicatePayload = extractorBatchDuplicateCountQuery(datasetId, `${time_period}d`);

    const [
        transformationSuccessResponse, dedupSuccessResponse, denormSuccessResponse,
        totalValidationResponse, totalValidationFailedResponse, transformationFailedResponse,
        dedupFailedResponse, denormFailedResponse, extractorSuccessCountResponse,
        extractorBatchDuplicateResponse
    ] = await Promise.all([
        axios.post(nativeQueryEndpoint, transformationSuccessPayload),
        axios.post(nativeQueryEndpoint, dedupSuccessPayload),
        axios.post(nativeQueryEndpoint, denormSuccessPayload),
        axios.post(nativeQueryEndpoint, totalValidationPayload),
        axios.post(nativeQueryEndpoint, totalValidationFailedPayload),
        axios.post(nativeQueryEndpoint, transformationFailedPayload),
        axios.request({ url: prometheusEndpoint, method: "GET", params: dedupFailedPayload }),
        axios.post(nativeQueryEndpoint, denormFailedPayload),
        axios.request({ url: prometheusEndpoint, method: "GET", params: extractorSuccessCountPayload }),
        axios.request({ url: prometheusEndpoint, method: "GET", params: extractorBatchDuplicatePayload }),
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
    const dedupFailedCount = _.map(_.get(dedupFailedResponse, 'data.data.result'), payload => {
        return _.floor(_.get(payload, 'values[0][1]')) || 0
    })
    const extractorSuccessCount = _.map(_.get(extractorSuccessCountResponse, 'data.data.result'), payload => {
        return _.floor(_.get(payload, 'values[0][1]')) || 0
    })
    const extractorBatchDuplicateCount = _.map(_.get(extractorBatchDuplicateResponse, 'data.data.result'), payload => {
        return _.floor(_.get(payload, 'values[0][1]')) || 0
    })
    const denormFailedCount = _.get(denormFailedResponse, "data[0].result.count") || 0;
    return {
        category: "data_lineage",
        components: [
            { type: "extractor_batch_success", value: extractorSuccessCount[0] },
            { type: "total_success", value: storageSuccessCount },
            { type: "dedup_success", value: dedupSuccessCount },
            { type: "denormalization_success", value: denormSuccessCount },
            { type: "transformation_success", value: transformationSuccessCount },
            { type: "extraction_failed", value: 0 },
            { type: "total_failed", value: totalValidationFailedCount + dedupFailedCount[0] },
            { type: "dedup_failed", value: dedupFailedCount[0] },
            { type: "denorm_failed", value: denormFailedCount },
            { type: "transformation_failed", value: transformationFailedCount },
            { type: "extractor_batch_duplicate", value: extractorBatchDuplicateCount[0] }
        ]
    };
};


export const getConnectorsData = async (dataset_id: string, intervals: string) => {
    const connectorQueryPayload = generateConnectorQuery(intervals, dataset_id);
    const connectorResponse = await axios.post(nativeQueryEndpoint, connectorQueryPayload);
    const connectorsData = _.get(connectorResponse, "data[0].result", []);
    const result = {
        category: "connectors",
        components: connectorsData.map((item: any) => ({
            id: item.name,
            type: item.name === null ? "failed" : "success",
            value: item.count
        }))
    };

    return result;
};

export const getDownTime = async (dataset_id: string, time_period: string, max_period: number) => {
    const now = Date.now();
    const time_period_str = String(time_period);

    const intervals = (() => {
        const result = [];
        const unit = time_period_str === '1' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const count = parseInt(time_period_str, 10);

        for (let i = 0; i < count; i++) {
            result.push({ end: now - i * unit });
        }
        return result;
    })();

    const duration = time_period_str === "1" ? "1h" : "1d";
    const downtimeMetrics: any[] = [];

    const connectorsPayload: Record<string, any> = await datasetService.getConnectors(dataset_id, ["connector_id"]);
    if (connectorsPayload.length > 0) {
        connectorsPayload.forEach((containerPayload: { connector_id: string }) => {
            const transformedId = containerPayload.connector_id.replace(/\./g, '-');
            getDownTimeContainers.components.ingestion.push(
                { namespace: "connectors", container: `${transformedId}-jobmanager` },
                { namespace: "connectors", container: `${transformedId}-taskmanager` }
            );
        });
    }

    for (const [type, componentData] of Object.entries(getDownTimeContainers)) {
        for (const [componentType, pods] of Object.entries(componentData)) {
            for (const pod of pods) {
                if (!('container' in pod)) continue;

                const podQuery = `max(last_over_time(kube_pod_container_status_restarts_total{container="${pod.container}"}[${duration}])) by (pod)`;
                const podResponse = await prometheusQuery({ "query": podQuery });
                const podResult = podResponse.data.result.map((item: any) => item.metric.pod);

                for (const interval of intervals) {
                    let totalDowntime = 0;

                    for (const podName of podResult) {
                        const baseParams = {
                            container: pod.container,
                            pod: podName,
                            time: (interval.end / 1000).toString(),
                        };

                        const startQuery = `kube_pod_container_state_started{container="${baseParams.container}", pod="${baseParams.pod}"}[${duration}]`;
                        const terminatedQuery = `kube_pod_container_status_last_terminated_timestamp{container="${baseParams.container}", pod="${baseParams.pod}"}[${duration}]`;

                        const [startData, terminatedData] = await Promise.all([
                            prometheusQuery({ query: startQuery, time: baseParams.time }),
                            prometheusQuery({ query: terminatedQuery, time: baseParams.time }),
                        ]);

                        const startTimestamps = processTimestamps(startData);
                        const terminatedTimestamps = processTimestamps(terminatedData);
                        const length = Math.min(startTimestamps.length, terminatedTimestamps.length);

                        for (let i = 0; i < length; i++) {
                            const downtime = startTimestamps[i + 1] - terminatedTimestamps[i];
                            if (downtime > 0) totalDowntime += downtime;
                        }
                    }

                    downtimeMetrics.push({
                        container: pod.container,
                        componentType,
                        totalDowntime,
                        intervalStart: interval.end,
                        status: totalDowntime > max_period ? "Unhealthy" : "Healthy"
                    });
                }
            }
        }
    }

    const getStatusMap = (key: string) => {
        const statusMap: Record<string, string> = {};
        for (const metric of downtimeMetrics) {
            const val = metric[key];
            if (!statusMap[val] || metric.status === "Unhealthy") {
                statusMap[val] = metric.status;
            }
        }
        return statusMap;
    };

    return {
        category: "down_time",
        components: [
            {
                item: "total_downtime",
                value: downtimeMetrics.reduce((sum, m) => sum + m.totalDowntime, 0),
                status: downtimeMetrics.some(m => m.status === "Unhealthy") ? "Unhealthy" : "Healthy",
            },
            {
                item: "total_downtime_per_component",
                value: downtimeMetrics.reduce((acc, m) => {
                    acc[m.componentType] = (acc[m.componentType] || 0) + m.totalDowntime;
                    return acc;
                }, {} as Record<string, number>),
                status: getStatusMap("componentType"),
            },
            {
                item: "downtime_per_interval_with_component_and_container",
                value: downtimeMetrics.reduce((acc: any, metric: any) => {
                    const date = metric.intervalStart;
                    const component = metric.componentType;
                    const container = metric.container;

                    if (!acc[date]) acc[date] = {};
                    if (!acc[date][component]) acc[date][component] = {};
                    if (!acc[date][component][container])
                        acc[date][component][container] = 0;

                    acc[date][component][container] += metric.totalDowntime;
                    return acc;
                }, {})
            },
            {
                item: "total_downtime_per_interval",
                value: downtimeMetrics.reduce((acc, m) => {
                    acc[m.intervalStart] = (acc[m.intervalStart] || 0) + m.totalDowntime;
                    return acc;
                }, {} as Record<string, number>),
                status: getStatusMap("intervalStart"),
            },
            {
                item: "container status per interval",
                value: (() => {
                    const resultMap: Record<string, Record<string, Set<string>>> = {};
                    for (const metric of downtimeMetrics) {
                        if (metric.status === "Unhealthy") {
                            const { intervalStart, componentType, container } = metric;
                            if (!resultMap[intervalStart]) resultMap[intervalStart] = {};
                            if (!resultMap[intervalStart][componentType]) resultMap[intervalStart][componentType] = new Set();
                            resultMap[intervalStart][componentType].add(container);
                        }
                    }
                    const finalOutput: Record<string, Record<string, string[]>> = {};
                    for (const [interval, components] of Object.entries(resultMap)) {
                        finalOutput[interval] = {};
                        for (const [component, containersSet] of Object.entries(components)) {
                            finalOutput[interval][component] = Array.from(containersSet);
                        }
                    }
                    return finalOutput;
                })(),
            }
        ],
    };
};

const prometheusQuery = async (query: Record<string, any>) => {
    const params = new URLSearchParams(query);

    const response = await fetch(`${prometheusQueryEndpoint}?${params}`);
    if (!response.ok) {
        throw new Error(`Prometheus query failed: ${response.statusText}`);
    }
    return await response.json();
}


const processTimestamps = (response: any): number[] => {
    const timestampSet = new Set<number>();
    response.data.result.forEach((metricResult: any) => {
        metricResult.values.forEach(([, value]: [number, string]) => {
            timestampSet.add(Number(value));
        });
    });
    const timestamps = Array.from(timestampSet);
    timestamps.sort((a, b) => a - b);
    return timestamps;
}