import { routesConfig } from "../configs/RoutesConfig"
import { config as appConfig } from "../configs/Config";

const config = {
  apiDruidEndPoint: `${routesConfig.query.native_query.path}`,
  apiDruidSqlEndPoint: `${routesConfig.query.sql_query.path}`,
  apiDatasetIngestEndPoint: `${routesConfig.data_ingest.path}`,
  apiDatasetSaveEndPoint: `${routesConfig.config.dataset.save.path}`,
  apiDatasetUpdateEndPoint: `${routesConfig.config.dataset.update.path}`,
  apiDatasetReadEndPoint: `${routesConfig.config.dataset.read.path}`,
  apiDatasetListEndPoint: `${routesConfig.config.dataset.list.path}`,
  apiDatasourceSaveEndPoint: `${routesConfig.config.datasource.save.path}`,
  apiDatasourceUpdateEndPoint: `${routesConfig.config.datasource.update.path}`,
  apiDatasourceReadEndPoint: `${routesConfig.config.datasource.read.path}`,
  apiDatasourceListEndPoint: `${routesConfig.config.datasource.list.path}`,
  apiDatasetSourceConfigSaveEndPoint: `${routesConfig.config.dataset_source_config.save.path}`,
  apiDatasetSourceConfigUpdateEndPoint: `${routesConfig.config.dataset_source_config.update.path}`,
  apiDatasetSourceConfigReadEndPoint: `${routesConfig.config.dataset_source_config.read.path}`,
  apiDatasetSourceConfigListEndPoint: `${routesConfig.config.dataset_source_config.list.path}`,
  apiExhaustEndPoint: `${routesConfig.exhaust.path}`,
  druidHost: `${appConfig.query_api.druid.host}`,
  druidPort: `${appConfig.query_api.druid.port}`,
  druidEndPoint: `${appConfig.query_api.druid.native_query_path}`,
  druidSqlEndPoint: `${appConfig.query_api.druid.sql_query_path}`,
  storage_url_expiry: 3600,
  exhaustMaxDateRange: 31,
  druidDatasourcesEndPoint: `${appConfig.query_api.druid.list_datasources_path}`,
  druidSubmitIngestionEndPoint: `/${appConfig.query_api.druid.submit_ingestion}`,
  apiSubmitIngestionEndPoint: `${routesConfig.submit_ingestion.path}`
};
export { config };
