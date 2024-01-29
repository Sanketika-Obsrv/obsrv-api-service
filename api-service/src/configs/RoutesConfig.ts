export const routesConfig = {
  default: {
    api_id: "api",
    validation_schema: null,
  },
  query: {
    native_query: {
      api_id: "native.query",
      method: "post",
      path: "/data/v1/query",
      validation_schema: "QueryRequest.json",
    },
    native_query_with_params: {
      api_id: "native.query",
      method: "post",
      path: "/data/v1/query/:datasetId",
      validation_schema: "QueryRequest.json",
    },
    sql_query: {
      api_id: "sql.query",
      method: "post",
      path: "/data/v1/sql-query",
      validation_schema: "QueryRequest.json",
    },
    sql_query_with_params: {
      api_id: "sql.query",
      method: "post",
      path: "/data/v1/sql-query/:datasetId",
      validation_schema: "QueryRequest.json",
    },
  },
  config: {
    dataset: {
      save: {
        api_id: "config.dataset.create",
        method: "post",
        path: "/datasets/v1/create",
        validation_schema: "DatasetCreateReq.json",
      },
      read: {
        api_id: "config.dataset.read",
        method: "get",
        path: "/datasets/v1/get/:datasetId",
        validation_schema: null,
      },
      update: {
        api_id: "config.dataset.update",
        method: "patch",
        path: "/datasets/v1/update",
        validation_schema: "DatasetUpdateReq.json",
      },
      list: {
        api_id: "config.dataset.list",
        method: "post",
        path: "/datasets/v1/list",
        validation_schema: "DatasetListReq.json",
      },
    },
    datasource: {
      save: {
        api_id: "config.datasource.create",
        method: "post",
        path: "/datasources/v1/create",
        validation_schema: "DatasourceSaveReq.json",
      },
      read: {
        api_id: "config.datasource.read",
        method: "get",
        path: "/datasources/v1/get/:datasourceId",
        validation_schema: null,
      },
      update: {
        api_id: "config.datasource.update",
        method: "patch",
        path: "/datasources/v1/update",
        validation_schema: "DatasourceUpdateReq.json",
      },
      list: {
        api_id: "config.datasource.list",
        method: "post",
        path: "/datasources/v1/list",
        validation_schema: "DatasetListReq.json",
      },
    },
    dataset_source_config: {
      save: {
        api_id: "config.dataset.source.config.create",
        method: "post",
        path: "/datasets/v1/source/config/create",
        validation_schema: "DatasetSourceConfigSaveReq.json",
      },
      read: {
        api_id: "config.dataset.source.config.read",
        method: "get",
        path: "/datasets/v1/source/config/get/:datasetId",
        validation_schema: null,
      },
      update: {
        api_id: "config.dataset.source.config.update",
        method: "patch",
        path: "/datasets/v1/source/config/update",
        validation_schema: "DatasetSourceConfigUpdateReq.json",
      },
      list: {
        api_id: "config.dataset.source.config.list",
        method: "post",
        path: "/datasets/v1/source/config/list",
        validation_schema: "DatasetListReq.json",
      },
    }

  },
  data_ingest: {
    api_id: "dataset.data.in",
    method: "post",
    path: "/data/v1/in/:datasetId",
    validation_schema: "DataIngestionReq.json",
  },
  tenant_ingest: {
    api_id: "dataset.data.in",
    method: "post",
    path: "/data/tenant/in/:datasetId",
    validation_schema: "DataIngestionReq.json",
  },
  exhaust: {
    api_id: "dataset.data.exhaust",
    method: "get",
    path: "/data/v1/exhaust/:datasetId",
    validation_schema: "DataExhaustReq.json"
  },
  prometheus: {
    method: "get",
    path: "/metrics",
    validation_schema: null,
  },
  submit_ingestion: {
    api_id: "submit.ingestion",
    method: "post",
    path: "/data/v1/submit/ingestion",
    validation_schema: "SubmitIngestionReq.json"
  },
  query_wrapper: {
    sql_wrapper: {
      api_id: "query.wrapper.sql.query",
      method: "post",
      path: "/v1/sql",
    },
    native_post: {
      api_id: "query.wrapper.native.post",
      method: "post",
      path: /\/druid\/v2.*/,
    },
    native_get: {
      api_id: "query.wrapper.native.get",
      method: "get",
      path: /\/druid\/v2.*/
    },
    native_delete: {
      api_id: "query.wrapper.native.delete",
      method: "delete",
      path: "/druid/v2/:queryId"
    },
    druid_status: {
      api_id: "query.wrapper.status",
      method: "get",
      path: "/status"
    }
  },
  health: {
    api_id: "api.health",
    method: "get",
    path: "/health"
  }
}

