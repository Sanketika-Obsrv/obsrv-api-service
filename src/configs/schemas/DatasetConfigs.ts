import { queryRules } from "../QueryRules";
export  const datasetQueryDefaultConfig = queryRules
export const datasetIngestionDefaultConfig = {
    dataset: "observ-demo",
    indexCol: "ets",
    granularitySpec: {
        segmentGranularity: "DAY",
        queryGranularity: "hour",
        rollup: true
    }
}
export const datasetProcessingDefaultConfigs = {
    topic: "",
    extraction: {
        is_batch_event: false,
        extraction_key: "events",
        dedup_config: {
            drop_duplicates: false,
            dedup_key: "",
            dedup_period: 1400
        }
    },
    dedup_config: {
        drop_duplicates: false,
        dedup_key: "",
        dedup_period: 1400
    },
    validation_config: {
        validate: true,
        mode: ""
    },
    denorm_config: {
        redis_db_host: "",
        redis_db_port: "",
        denorm_fields: {
            denorm_key: "",
            redis_db: 1,
            denorm_out_field: "metadata"
        }
    },
    router_config: {
        topic: ""
    }
}