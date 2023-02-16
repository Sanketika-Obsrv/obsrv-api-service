import routes from "../routes/RoutesConfig"
const config = {

  apiDruidEndPoint: `${routes.QUERY.BASE_PATH}${routes.QUERY.API_VERSION}${routes.QUERY.NATIVE_QUERY.URL}`,
  apiDruidSqlEndPoint: `${routes.QUERY.BASE_PATH}${routes.QUERY.API_VERSION}${routes.QUERY.SQL_QUERY.URL}`,
  apiIngestionSpecEndPoint: `${routes.SCHEMA.BASE_PATH}${routes.SCHEMA.API_VERSION}${routes.SCHEMA.INGESTION_SCHEMA.URL}`,
  apiCreateDatasetEndPoint: `${routes.DATASET.BASE_PATH}${routes.DATASET.API_VERSION}${routes.DATASET.CREATE.URL}`,
  apiDatasetSchemaGenerateEndPoint: `${routes.SCHEMA.BASE_PATH}${routes.SCHEMA.API_VERSION}${routes.SCHEMA.DATASET_SCHEMA.URL}`,
  apiIngestionSchemaGenerateEndPoint: `${routes.SCHEMA.BASE_PATH}${routes.SCHEMA.API_VERSION}${routes.SCHEMA.INGESTION_SCHEMA.URL}`,
  druidHost: "http://localhost",
  druidPort: 8888,
  druidEndPoint: "/druid/v2",
  druidSqlEndPoint: "/druid/v2/sql/",
  

};
export { config };
