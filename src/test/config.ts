import routes from "../routes/routesConfig"
const config = {

  apiDruidEndPoint: `${routes.QUERY.BASE_PATH}${routes.QUERY.API_VERSION}${routes.QUERY.NATIVE_QUERY.URL}`,
  apiDruidSqlEndPoint: `${routes.QUERY.BASE_PATH}${routes.QUERY.API_VERSION}${routes.QUERY.SQL_QUERY.URL}`,
  apiIngestionSpecEndPoint: `${routes.SCHEMA.BASE_PATH}${routes.SCHEMA.API_VERSION}${routes.SCHEMA.INGESTION_SCHEMA.URL}`,
  apiCreateDatasetEndPoint: `${routes.DATASET.BASE_PATH}${routes.DATASET.API_VERSION}${routes.DATASET.CREATE.URL}`,
  druidHost: "http://localhost",
  druidPort: 8888,
  druidEndPoint: "/druid/v2/",
  druidSqlEndPoint: "/druid/v2/sql/",
  kafkaHost: "http://localhost",
  kafkaPort: 9092,

  "kafkaConfig": {
    "brokers": ["localhost:9092"],
    "clientId": "obsrv-apis",
    "retry": {
      "initialRetryTime": 1000,
      "retries": 3
    },
    "connectionTimeout": 1000
  },
  "topics": {
    "create": "telemetry.input",
    "mutate": "telemetry.mutate"
  }


};
export { config };
