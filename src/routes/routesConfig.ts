
const routes = {
  "API_ID": "obsrv.api",

  "QUERY": {
    "BASE_PATH": "/query",
    "API_VERSION": "/v2",
    "NATIVE_QUERY": {
      "URL": "/native-query",
      "METHOD": "POST",
      "API_ID": "obsrv.native.query"
    },
    "SQL_QUERY": {
      "URL": "/sqlquery",
      "METHOD": "POST",
      "API_ID": "obsrv.sql.query"
    }
  },
  "SCHEMA": {
    "BASE_PATH": "/schema",
    "API_VERSION": "/v2",

    "INGESTION_SCHEMA": {
      "URL": "/ingestion/generate",
      "METHOD": "POST",
      "API_ID": "obsrv.config.ingestion.generate"
    },

    "DATASET_SCHEMA": {
      "URL": "/generate",
      "METHOD": "POST",
      "API_ID": "obsrv.config.schema.generate"
    },

  },
  "MANAGEMENT": {
    "BASE_PATH": "/manage",
    "API_VERSION": "/v2",
    "HEALTH_CHECK": {
      "URL": "/health",
      "METHOD": "GET",
      "API_ID": "obsrv.manage.health"
    },
    "STATUS": {
      "URL": "/status",
      "METHOD": "GET",
      "API_ID": "obsrv.manage.status"
    },


  },
  "GET_STATUS": {
    "URL": "/obsrv/status",
    "METHOD": "GET",
    "API_ID": "obsrv.status"
  },
  "HEALTH_CHECK": {
    "URL": "/obsrv/health",
    "METHOD": "GET",
    "API_ID": "obsrv.health"
  },
  "DATASET": {
    "BASE_PATH": "/data",
    "API_VERSION": "/v2",
    "CREATE": {
      "URL": "/create",
      "METHOD": "POST",
      "API_ID": "obsrv.data.create"
    },
    "UPDATE": {
      "URL": "/update",
      "METHOD": "PATCH",
      "API_ID": "obsrv.data.update"
    },
    "DELETE": {
      "URL": "/delete",
      "METHOD": "DELETE",
      "API_ID": "obsrv.data.remove"
    }
  }
}

export default routes
