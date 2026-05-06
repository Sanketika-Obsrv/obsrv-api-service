import _ from "lodash";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { executeNativeQuery, getDatasourceListWithSizeFromDruid } from "../../connections/druidConnection";
import { getDatasetHealth } from "../../services/DatasetHealthService";
import { HealthStatus } from "../../types/DatasetModels";
import logger from "../../logger";

dayjs.extend(utc);

const batchTotalEventsQuery = (intervals: string, datasetIds: string[]) => ({
    queryType: "groupBy",
    dataSource: { type: "table", name: "system-events" },
    intervals: { type: "intervals", intervals: [intervals] },
    granularity: { type: "all", timeZone: "UTC" },
    filter: {
        type: "in",
        dimension: "ctx_dataset",
        values: datasetIds
    },
    dimensions: [{ type: "default", dimension: "ctx_dataset", outputName: "ctx_dataset" }],
    aggregations: [
        { type: "longSum", name: "total_events_count", fieldName: "count" }
    ]
});

const batchFailedEventsQuery = (intervals: string, datasetIds: string[]) => ({
    queryType: "groupBy",
    dataSource: { type: "table", name: "system-events" },
    intervals: { type: "intervals", intervals: [intervals] },
    granularity: { type: "all", timeZone: "UTC" },
    filter: {
        type: "and",
        fields: [
            {
                type: "in",
                dimension: "ctx_dataset",
                values: datasetIds
            },
            {
                type: "equals",
                column: "ctx_pdata_pid",
                matchValueType: "STRING",
                matchValue: "validator"
            },
            {
                type: "equals",
                column: "error_pdata_status",
                matchValueType: "STRING",
                matchValue: "failed"
            }
        ]
    },
    dimensions: [{ type: "default", dimension: "ctx_dataset", outputName: "ctx_dataset" }],
    aggregations: [
        { type: "longSum", name: "failed_events_count", fieldName: "count" }
    ]
});

const executeBatchQuery = async (query: object, countField: string): Promise<Record<string, number>> => {
    try {
        const result = await executeNativeQuery(query);
        const rows: any[] = _.get(result, "data", []);
        return _.reduce(rows, (acc, row) => {
            const datasetId: string = _.get(row, "event.ctx_dataset") || _.get(row, "ctx_dataset");
            const count: number = _.get(row, `event.${countField}`) ?? _.get(row, countField) ?? 0;
            if (datasetId) acc[datasetId] = count;
            return acc;
        }, {} as Record<string, number>);
    } catch (err) {
        logger.warn({ message: "Batch Druid query failed, metrics will be 0", err });
        return {};
    }
};

const getDruidDatasourceSizes = async (): Promise<Record<string, number>> => {
    try {
        const result = await getDatasourceListWithSizeFromDruid();
        const datasources: any[] = _.get(result, "data", []);
        return _.reduce(datasources, (acc, ds: any) => {
            if (ds && ds.name) {
                const size = _.get(ds, "properties.segments.replicatedSize", 0);
                acc[ds.name] = (acc[ds.name] || 0) + size;
            }
            return acc;
        }, {} as Record<string, number>);
    } catch (err) {
        logger.warn({ message: "Failed to fetch Druid datasource sizes", err });
        return {};
    }
};

const getDatasetHealthSummary = async (dataset: Record<string, any>): Promise<{ health: string; unhealthy_components: string[] }> => {
    try {
        const result = await getDatasetHealth(["infra", "processing"], dataset);
        const unhealthy = _.compact(
            _.flatMap(_.get(result, "details", []), (detail: any) =>
                _.map(
                    _.filter(detail.components, (c: any) => c.status === HealthStatus.UnHealthy),
                    (c: any) => c.type
                )
            )
        );
        return { health: result.status, unhealthy_components: unhealthy };
    } catch (err) {
        logger.warn({ message: `Health check failed for dataset ${dataset.dataset_id}`, err });
        return { health: HealthStatus.UnHealthy, unhealthy_components: [] };
    }
};

export const enrichDatasetsWithMetrics = async (datasets: Record<string, any>[]): Promise<Record<string, any>[]> => {
    if (datasets.length === 0) return [];

    const datasetIds = datasets.map((d) => d.dataset_id);
    const now = dayjs.utc().startOf("day");
    const startOfToday = now.toISOString();
    const startOfYesterday = now.subtract(1, "day").toISOString();
    const endOfToday = now.add(1, "day").toISOString();
    const allTimeStart = "2000-01-01T00:00:00Z";

    const [
        totalEventsMap,
        eventsTodayMap,
        eventsYesterdayMap,
        failedTodayMap,
        druidSizes,
        healthResults
    ] = await Promise.all([
        executeBatchQuery(batchTotalEventsQuery(`${allTimeStart}/${endOfToday}`, datasetIds), "total_events_count"),
        executeBatchQuery(batchTotalEventsQuery(`${startOfToday}/${endOfToday}`, datasetIds), "total_events_count"),
        executeBatchQuery(batchTotalEventsQuery(`${startOfYesterday}/${startOfToday}`, datasetIds), "total_events_count"),
        executeBatchQuery(batchFailedEventsQuery(`${startOfToday}/${endOfToday}`, datasetIds), "failed_events_count"),
        getDruidDatasourceSizes(),
        Promise.all(datasets.map((d) => getDatasetHealthSummary(d).then((h) => ({ dataset_id: d.dataset_id, ...h }))))
    ]);

    const healthMap = _.keyBy(healthResults, "dataset_id");

    return datasets.map((dataset) => {
        const id = dataset.dataset_id;
        const datasourceRef: string | undefined = dataset.datasource_ref;
        const healthInfo = healthMap[id] || { health: null, unhealthy_components: [] };

        return {
            ...dataset,
            health: healthInfo.health,
            unhealthy_components: healthInfo.unhealthy_components,
            metrics: {
                total_events: totalEventsMap[id] ?? 0,
                events_today: eventsTodayMap[id] ?? 0,
                events_yesterday: eventsYesterdayMap[id] ?? 0,
                failed_today: failedTodayMap[id] ?? 0,
                storage_size_bytes: datasourceRef ? (druidSizes[datasourceRef] ?? 0) : 0
            }
        };
    });
};
