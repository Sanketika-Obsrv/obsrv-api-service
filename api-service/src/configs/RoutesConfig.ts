export const routesConfig = {
  default: {
    api_id: "obsrv.api",
    validation_schema: null,
  },
  query: {
    native_query: {
      api_id: "obsrv.native.query",
      method: "post",
      path: "/obsrv/v1/data/query",
      validation_schema: "QueryRequest.json",
    },
    native_query_with_params: {
      api_id: "obsrv.native.query",
      method: "post",
      path: "/obsrv/v1/data/query/:datasetId",
      validation_schema: "QueryRequest.json",
    },
    sql_query: {
      api_id: "obsrv.sql.query",
      method: "post",
      path: "/obsrv/v1/data/sql-query",
      validation_schema: "QueryRequest.json",
    },
    sql_query_with_params: {
      api_id: "obsrv.sql.query",
      method: "post",
      path: "/obsrv/v1/data/sql-query/:datasetId",
      validation_schema: "QueryRequest.json",
    },
  },
  config: {
    dataset: {
      save: {
        api_id: "obsrv.config.dataset.create",
        method: "post",
        path: "/obsrv/v1/datasets/create",
        validation_schema: "DatasetCreateReq.json",
      },
      read: {
        api_id: "obsrv.config.dataset.read",
        method: "get",
        path: "/obsrv/v1/datasets/get/:datasetId",
        validation_schema: null,
      },
      update: {
        api_id: "obsrv.config.dataset.update",
        method: "patch",
        path: "/obsrv/v1/datasets/update",
        validation_schema: "DatasetUpdateReq.json",
      },
      list: {
        api_id: "obsrv.config.dataset.list",
        method: "post",
        path: "/obsrv/v1/datasets/list",
        validation_schema: "DatasetListReq.json",
      },
    },
    datasource: {
      save: {
        api_id: "obsrv.config.datasource.create",
        method: "post",
        path: "/obsrv/v1/datasources/create",
        validation_schema: "DatasourceSaveReq.json",
      },
      read: {
        api_id: "obsrv.config.datasource.read",
        method: "get",
        path: "/obsrv/v1/datasources/get/:datasourceId",
        validation_schema: null,
      },
      update: {
        api_id: "obsrv.config.datasource.update",
        method: "patch",
        path: "/obsrv/v1/datasources/update",
        validation_schema: "DatasourceUpdateReq.json",
      },
      list: {
        api_id: "obsrv.config.datasource.list",
        method: "post",
        path: "/obsrv/v1/datasources/list",
        validation_schema: "DatasetListReq.json",
      },
    },
    dataset_source_config: {
      save: {
        api_id: "obsrv.config.dataset.source.config.create",
        method: "post",
        path: "/obsrv/v1/datasets/source/config/create",
        validation_schema: "DatasetSourceConfigSaveReq.json",
      },
      read: {
        api_id: "obsrv.config.dataset.source.config.read",
        method: "get",
        path: "/obsrv/v1/datasets/source/config/get/:datasetId",
        validation_schema: null,
      },
      update: {
        api_id: "obsrv.config.dataset.source.config.update",
        method: "patch",
        path: "/obsrv/v1/datasets/source/config/update",
        validation_schema: "DatasetSourceConfigUpdateReq.json",
      },
      list: {
        api_id: "obsrv.config.dataset.source.config.list",
        method: "post",
        path: "/obsrv/v1/datasets/source/config/list",
        validation_schema: "DatasetListReq.json",
      },
    }

  },
  data_ingest: {
    api_id: "obsrv.dataset.data.in",
    method: "post",
    path: "/obsrv/v1/data/create/:datasetId",
    validation_schema: "DataIngestionReq.json",
  },
  exhaust: {
    api_id: "obsrv.dataset.data.exhaust",
    method: "get",
    path: "/obsrv/v1/data/exhaust/:datasetId",
    validation_schema: "DataExhaustReq.json"
  },
  prometheus: {
    method: "get",
    path: "/metrics",
    validation_schema: null,
  },
  submit_ingestion: {
    api_id: "obsrv.submit.ingestion",
    method: "post",
    path: "/obsrv/v1/data/submit/ingestion",
    validation_schema: "SubmitIngestionReq.json"
  },
  query_wrapper: {
    sql_wrapper: {
      api_id: "obsrv.query.wrapper.sql.query",
      method: "post",
      path: "/obsrv/v1/sql",
    },
    native_post: {
      api_id: "obsrv.query.wrapper.native.post",
      method: "post",
      path: /\/druid\/v2.*/,
    },
    native_get: {
      api_id: "obsrv.query.wrapper.native.get",
      method: "get",
      path: /\/druid\/v2.*/
    },
    native_delete: {
      api_id: "obsrv.query.wrapper.native.delete",
      method: "delete",
      path: "/druid/v2/:queryId"
    },
    druid_status: {
      api_id: "obsrv.query.wrapper.status",
      method: "get",
      path: "/status"
    }
  }
}

