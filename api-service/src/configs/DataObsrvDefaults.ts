export const getDownTimeContainers = {
    components: {
        ingestion: [
            { namespace: "kafka", container: "kafka" },
            { namespace: "dataset-api", container: "dataset-api" }
        ],
        processing: [
            { namespace: "flink", container: "unified-pipeline-jobmanager" },
            { namespace: "flink", container: "unified-pipeline-taskmanager" },
            { namespace: "flink", container: "cache-indexer-jobmanager" },
            { namespace: "flink", container: "cache-indexer-taskmanager" },
            { namespace: "redis", container: "valkey" },
            { namespace: "flink", container: "lakehouse-connector-jobmanager" },
            { namespace: "flink", container: "lakehouse-connector-taskmanager" },
            { namespace: "postgresql", container: "postgresql" }
        ],
        querying: [
            { namespace: "druid-raw", container: "druid-raw-brokers" },
            { namespace: "druid-raw", container: "druid-raw-indexers" },
            { namespace: "druid-raw", container: "druid-raw-coordinators" },
            { namespace: "druid-raw", container: "druid-raw-historicals" },
            { namespace: "druid-raw", container: "druid-raw-overlords" },
            { namespace: "dataset-api", container: "dataset-api" }
        ]
    }
};