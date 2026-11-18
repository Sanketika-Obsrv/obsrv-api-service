import axios from "axios";
import { config } from "../configs/Config";
import { logger } from "@project-sunbird/logger";
import { health as postgresHealth } from "../connections/databaseConnection";
import { DatasetType, DataSourceType, HealthStatus } from "../types/DatasetModels";
import { createClient } from "redis";
import { isHealthy as isKafkaHealthy } from "../connections/kafkaConnection";
import { druidHttpService, executeNativeQuery } from "../connections/druidConnection";
import _ from "lodash";
import moment from "moment";
import { SystemConfig } from "./SystemConfig";
import { datasetService } from "./DatasetService";
const dateFormat = "YYYY-MM-DDT00:00:00+05:30"

const prometheusInstance = axios.create({ baseURL: config?.query_api?.prometheus?.url, headers: { "Content-Type": "application/json" } })

const prometheusQueries = {
  validationFailure: "sum(sum_over_time(flink_taskmanager_job_task_operator_PipelinePreprocessorJob_DATASETID_validator_failed_count[1d]))",
  dedupFailure: "sum(sum_over_time(flink_taskmanager_job_task_operator_PipelinePreprocessorJob_DATASETID_dedup_failed_count[1d]))",
  denormFailure: "sum(sum_over_time(flink_taskmanager_job_task_operator_DenormalizerJob_DATASETID_denorm_failed[1d]))",
  transformationFailure: "sum(sum_over_time(flink_taskmanager_job_task_operator_TransformerJob_DATASETID_transform_failed_count[1d]))",
  queriesCount: "sum(sum_over_time(node_total_api_calls{entity=\"data-out\", dataset_id=\"DATASETID\"}[1d]))",
  avgQueryResponseTimeInSec: "avg(avg_over_time(node_query_response_time{entity=\"data-out\", dataset_id=\"DATASETID\"}[1d]))/1000",
  queriesFailedCount: "sum(sum_over_time(node_failed_api_calls{entity=\"data-out\", dataset_id=\"DATASETID\"}[1d]))"
}

export const getDatasetHealth = async (categories: any, dataset: any) => {

  const details = []
  if (categories.includes("infra")) {
    const isMasterDataset = _.get(dataset, "type") == DatasetType.master;
    const { components, status } = await getInfraHealth(isMasterDataset)
    details.push({
      "category": "infra",
      "status": status,
      "components": components
    })
  }
  if (categories.includes("processing")) {
    const { components, status } = await getProcessingHealth(dataset)
    details.push({
      "category": "processing",
      "status": status,
      "components": components
    })
  }

  if (categories.includes("query")) {
    const datasources = await datasetService.findDatasources({ dataset_id: dataset.id, type: DataSourceType.druid }, ["dataset_id", "datasource"])
    const { components, status } = await getQueryHealth(datasources, dataset)
    details.push({
      "category": "query",
      "status": status,
      "components": components
    })
  }

  const allStatus = _.includes(_.map(details, (detail) => detail?.status), HealthStatus.UnHealthy) ? HealthStatus.UnHealthy : HealthStatus.Healthy
  return {
    "status": allStatus,
    "details": details
  }
}
const getDatasetIdForMetrics = (datasetId: string) => {
  datasetId = datasetId.replace(/-/g, "_")
    .replace(/\./g, "_")
    .replace(/\n/g, "")
    .replace(/[\n\r]/g, "")
  return datasetId;
}

const queryMetrics = async (datasetId: string, query: string) => {
  const queryWithDatasetId = query.replace("DATASETID", getDatasetIdForMetrics(datasetId))
  try { 
    const { data } = await prometheusInstance.get("/api/v1/query", { params: {query: queryWithDatasetId} })
    return { count: _.toInteger(_.get(data, "data.result[0].value[1]", "0")) || 0, health: HealthStatus.Healthy }
  } catch (error) {
    logger.error(error)
    return { count: 0, health: HealthStatus.UnHealthy }
  }
  
}

export const getInfraHealth = async (isMasterDataset: boolean): Promise<{ components: any, status: string }> => {
  const postgres = await getPostgresStatus()
  const druid = await getDruidHealthStatus()
  const flink = await getFlinkHealthStatus()
  const kafka = await getKafkaHealthStatus()
  let redis = HealthStatus.Healthy
  const components = [
    { "type": "postgres", "status": postgres },
    { "type": "kafka", "status": kafka },
    { "type": "druid", "status": druid },
    { "type": "flink", "status": flink }
  ]
  if (isMasterDataset) {
    redis = await getRedisHealthStatus()
    components.push({ "type": "redis", "status": redis })
  }
  const status = [postgres, redis, kafka, druid, flink].includes(HealthStatus.UnHealthy) ? HealthStatus.UnHealthy : HealthStatus.Healthy
  return { components, status };
}

export const getProcessingHealth = async (dataset: any): Promise<{ components: any, status: string }> => {
  const dataset_id = _.get(dataset, "dataset_id")
  const isMasterDataset = _.get(dataset, "type") == DatasetType.master;
  const flink = await getFlinkHealthStatus()
  const { count, health } = await getEventsProcessedToday(dataset_id, isMasterDataset)
  const processingDefaultThreshold = await SystemConfig.getThresholds("processing")
  // eslint-disable-next-line prefer-const
  let { count: avgCount, health: avgHealth } = await getAvgProcessingSpeedInSec(dataset_id, isMasterDataset)
  if (avgHealth == HealthStatus.Healthy) {
    if (avgCount > processingDefaultThreshold?.avgProcessingSpeedInSec) {
      avgHealth = HealthStatus.UnHealthy
    }
  }
  const failure = await queryMetrics(dataset_id, prometheusQueries.validationFailure)
  failure.health = getProcessingComponentHealth(failure, count, processingDefaultThreshold?.validationFailuresCount)

  const dedupFailure = await queryMetrics(dataset_id, prometheusQueries.dedupFailure)
  dedupFailure.health = getProcessingComponentHealth(dedupFailure, count, processingDefaultThreshold?.dedupFailuresCount)

  const denormFailure = await queryMetrics(dataset_id, prometheusQueries.denormFailure)
  denormFailure.health = getProcessingComponentHealth(denormFailure, count, processingDefaultThreshold?.denormFailureCount)

  const transformFailure = await queryMetrics(dataset_id, prometheusQueries.transformationFailure)
  transformFailure.health = getProcessingComponentHealth(transformFailure, count, processingDefaultThreshold?.transformFailureCount)

  const components = [
    {
      "type": "pipeline",
      "status": flink
    },
    {
      "type": "eventsProcessedCount",
      "count": count,
      "status": health
    },
    {
      "type": "avgProcessingSpeedInSec",
      "count": avgCount,
      "status": avgHealth
    },
    {
      "type": "validationFailuresCount",
      "count": failure?.count,
      "status": failure?.health
    },
    {
      "type": "dedupFailuresCount",
      "count": dedupFailure?.count,
      "status": dedupFailure?.health
    },
    {
      "type": "denormFailureCount",
      "count": denormFailure?.count,
      "status": denormFailure?.health
    },
    {
      "type": "transformFailureCount",
      "count": transformFailure?.count,
      "status": transformFailure?.health
    }
  ]
  const Healths = _.map(components, (component: any) => component?.status)

  const status = _.includes(Healths, HealthStatus.UnHealthy) ? HealthStatus.UnHealthy : HealthStatus.Healthy;

  return { components, status };
}

const getProcessingComponentHealth = (info: any, count: any, threshold: any) => {
  let status = info.health
  logger.debug({ info, count, threshold })
  if (info.health == HealthStatus.Healthy) {
    if (info.count > 0 && count == 0) {
      status = HealthStatus.UnHealthy
    } else {
      const percentage = (info.count / count) * 100
      if (percentage > threshold) {
        status = HealthStatus.UnHealthy
      }
    }
  }
  return status;
}

export const getQueryHealth = async (datasources: any, dataset: any): Promise<{ components: any, status: string }> => {

  const components: any = [];
  const isMasterDataset = _.get(dataset, "type") == DatasetType.master;
  let status = HealthStatus.Healthy;
  if (!isMasterDataset) {
    if (!_.isEmpty(datasources)) {
      const druidTasks = await getDruidIndexerStatus(datasources);
      components.push(
        {
          "type": "indexer",
          "status": _.get(druidTasks, "status"),
          "value": _.get(druidTasks, "value")
        }
      )
      if (_.get(druidTasks, "status") == HealthStatus.UnHealthy) {
        status = HealthStatus.UnHealthy
      }
    } else {
      components.push({
        "type": "indexer",
        "status": HealthStatus.UnHealthy,
        "value": []
      })
      status = HealthStatus.UnHealthy
    }
  }


  const queriesCount = await queryMetrics(dataset?.dataset_id, prometheusQueries.queriesCount)
  const defaultThresholds = await SystemConfig.getThresholds("query")

  components.push({
    "type": "queriesCount",
    "count": queriesCount.count,
    "status": queriesCount.health
  })

  const avgQueryReponseTimeInSec = await queryMetrics(dataset?.dataset_id, prometheusQueries.avgQueryResponseTimeInSec)
  if (avgQueryReponseTimeInSec.count > defaultThresholds?.avgQueryReponseTimeInSec) {
    avgQueryReponseTimeInSec.health = HealthStatus.UnHealthy
  }
  components.push({
    "type": "avgQueryReponseTimeInSec",
    "count": avgQueryReponseTimeInSec.count,
    "status": avgQueryReponseTimeInSec.health
  })

  const queriesFailed = await queryMetrics(dataset?.dataset_id, prometheusQueries.queriesFailedCount)
  if (queriesCount.count == 0 && queriesFailed.count > 0) {
    queriesFailed.health = HealthStatus.UnHealthy
  } else {
    const percentage = (queriesFailed.count / queriesCount.count) * 100;
    if (percentage > defaultThresholds?.queriesFailed) {
      queriesFailed.health = HealthStatus.UnHealthy
    }
  }
  if ([queriesFailed.health, avgQueryReponseTimeInSec.health].includes(HealthStatus.UnHealthy)) {
    status = HealthStatus.UnHealthy
  }

  components.push({
    "type": "queriesFailed",
    "count": queriesFailed.count,
    "status": queriesFailed.health
  })
  return { components, status }
}

const getDruidIndexerStatus = async (datasources: any,) => {
  try {
    const results = await Promise.all(_.map(datasources, (datasource) => getDruidDataourceStatus(datasource["datasource"])))
    const values: any = []
    let status = HealthStatus.Healthy
    _.forEach(results, (result: any) => {
      logger.debug({ result })
      const sourceStatus = _.get(result, "payload.state") == "RUNNING" ? HealthStatus.Healthy : HealthStatus.UnHealthy
      logger.debug({ sourceStatus })
      values.push(
        {
          "type": "druid",
          "datasource": _.get(result, "id"),
          "status": sourceStatus,
        }
      )
      if (sourceStatus == HealthStatus.UnHealthy) {
        status = HealthStatus.UnHealthy
      }
    })
    return { value: values, status }
  } catch (error) {
    logger.error(error)
    return { value: [], status: HealthStatus.UnHealthy }
  }
}

const getDruidDataourceStatus = async (datasourceId: string) => {
  logger.debug(datasourceId)
  const { data } = await druidHttpService.get(`/druid/indexer/v1/supervisor/${datasourceId}/status`)
  return data;
}

const getPostgresStatus = async (): Promise<HealthStatus> => {
  try {
    await postgresHealth()
  } catch (error) {
    logger.error(error)
    return HealthStatus.UnHealthy
  }
  return HealthStatus.Healthy
}

const connectToRedis = async (url: string) => {
  return new Promise((resolve, reject) => {
    createClient({
      url
    })
    .on("error", (err: any) => {
      reject(err)
    })
    .on("connect", () => {
      resolve("connected")
    })
    .connect();
  })
}

const getRedisHealthStatus = async () => {
  try {
    await Promise.all([connectToRedis(`redis://${config.redis_config.denorm_redis_host}:${config.redis_config.denorm_redis_port}`),
      connectToRedis(`redis://${config.redis_config.dedup_redis_host}:${config.redis_config.dedup_redis_port}`)]);
       return HealthStatus.Healthy;
  } catch (error) {
    logger.error(error)
  }
  return HealthStatus.UnHealthy;
}

const getKafkaHealthStatus = async () => {
  try {
    const status = await isKafkaHealthy()
    return status ? HealthStatus.Healthy : HealthStatus.UnHealthy
  } catch (error) {
    return HealthStatus.UnHealthy
  }

}

export const getFlinkHealthStatus = async () => {
  try {
    const responses = await Promise.all(
      [axios.get(config?.flink_job_configs?.masterdata_processor_job_manager_url as string + "/jobs"),
      axios.get(config?.flink_job_configs?.pipeline_merged_job_manager_url as string + "/jobs")]
    )
    const isHealthy = _.every(responses, (response: any) => {
      const { data = {} } = response;
      return _.get(data, "jobs[0].status") === "RUNNING"
    })
    return isHealthy ? HealthStatus.Healthy : HealthStatus.UnHealthy;
  } catch (error) {
    logger.error("Unable to get flink status", error)
  }
  return HealthStatus.UnHealthy;
}

const getDruidHealthStatus = async () => {
  try {
    const { data = false } = await druidHttpService.get("/status/health")
    return data ? HealthStatus.Healthy : HealthStatus.UnHealthy
  } catch (error) {
    logger.error(error)
    return HealthStatus.UnHealthy
  }
}

const getEventsProcessedToday = async (datasetId: string, isMasterDataset: boolean) => {
  const startDate = moment().format(dateFormat);
  const endDate = moment().add(1, "d").format(dateFormat);
  const intervals = `${startDate}/${endDate}`
  logger.debug({ datasetId, isMasterDataset })
  try {
    const { data } = await executeNativeQuery({
      "queryType": "timeseries",
      "dataSource": "system-events",
      "intervals": intervals,
      "granularity": {
        "type": "all",
        "timeZone": "Asia/Kolkata"
      },
      "filter": {
        "type": "and",
        "fields": [
          {
            "type": "selector",
            "dimension": "ctx_module",
            "value": "processing"
          },
          {
            "type": "selector",
            "dimension": "ctx_dataset",
            "value": datasetId
          },
          {
            "type": "selector",
            "dimension": "ctx_pdata_id",
            "value": isMasterDataset ? "MasterDataProcessorJob" : "DruidRouterJob"
          },
          {
            "type": "selector",
            "dimension": "error_code",
            "value": null
          }
        ]
      },
      "aggregations": [
        {
          "type": "longSum",
          "name": "count",
          "fieldName": "count"
        }
      ]
    })
    return { health: HealthStatus.Healthy, count: _.get(data, "[0].result.count", 0) || 0 }
  } catch (error) {
    logger.error(error)
    return { count: 0, health: HealthStatus.UnHealthy }
  }
}

const getAvgProcessingSpeedInSec = async (datasetId: string, isMasterDataset: boolean) => {
  const startDate = moment().format(dateFormat);
  const endDate = moment().add(1, "d").format(dateFormat);
  const intervals = `${startDate}/${endDate}`
  logger.debug({ datasetId, isMasterDataset })
  try {
    const { data } = await executeNativeQuery({
      "queryType": "groupBy",
      "dataSource": "system-events",
      "intervals": intervals,
      "granularity": {
        "type": "all",
        "timeZone": "Asia/Kolkata"
      },
      "filter": {
        "type": "and",
        "fields": [
          {
            "type": "selector",
            "dimension": "ctx_module",
            "value": "processing"
          },
          {
            "type": "selector",
            "dimension": "ctx_dataset",
            "value": datasetId
          },
          {
            "type": "selector",
            "dimension": "ctx_pdata_id",
            "value": isMasterDataset ? "MasterDataProcessorJob" : "DruidRouterJob"
          },
          {
            "type": "selector",
            "dimension": "error_code",
            "value": null
          }
        ]
      },
      "aggregations": [
        {
          "type": "longSum",
          "name": "processing_time",
          "fieldName": "total_processing_time"
        },
        {
          "type": "longSum",
          "name": "count",
          "fieldName": "count"
        }
      ],
      "postAggregations": [
        {
          "type": "expression",
          "name": "average_processing_time",
          "expression": "case_searched((count > 0),(processing_time/count),0",
        }
      ]
    })
    logger.debug({ average_processing_time: JSON.stringify(data) })
    const count = _.get(data, "[0].event.average_processing_time", 0) || 0
    return { health: HealthStatus.Healthy, count: count / 1000 }
  } catch (error) {
    logger.error(error)
    return { count: 0, health: HealthStatus.UnHealthy }
  }
}

export const getDruidIndexers = async (datasources: any, status = HealthStatus.Healthy) => {
  const results = await Promise.all(_.map(datasources, (datasource) => getDruidDataourceStatus(datasource["datasource"])))
  const indexers: any = []
  _.forEach(results, (result: any) => {
    logger.debug({ result })
    const sourceStatus = _.get(result, "payload.state") == "RUNNING" ? HealthStatus.Healthy : HealthStatus.UnHealthy
    logger.debug({ sourceStatus })
    if (sourceStatus == status) {
      indexers.push(
        {
          "type": "druid",
          "datasource": _.get(result, "id"),
          "status": sourceStatus,
          "state": _.get(result, "payload.state")
        }
      )
    }
  })
  return indexers
}

const restartDruidSupervisors = async (datasourceId: string) => {
const { data } = await druidHttpService.post(`/druid/indexer/v1/supervisor/${datasourceId}/resume`)
return data;
}

export const restartDruidIndexers = async (datasources: any) => {
  await Promise.all(_.map(datasources, (datasource) => restartDruidSupervisors(datasource["datasource"])))
}
