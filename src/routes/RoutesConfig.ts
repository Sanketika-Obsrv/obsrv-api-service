
const routes = {
  "API_ID": "obsrv.api",

  "QUERY": {
    "BASE_PATH": "/dataset",
    "API_VERSION": "/v2",
    "NATIVE_QUERY": {
      "URL": "/query/native-query",
      "METHOD": "POST",
      "API_ID": "obsrv.native.query"
    },
    "SQL_QUERY": {
      "URL": "/query/sqlquery",
      "METHOD": "POST",
      "API_ID": "obsrv.sql.query"
    }
  },
  "SCHEMA": {
    "BASE_PATH": "/dataset",
    "API_VERSION": "/v2",

    "INGESTION_SCHEMA": {
      "URL": "/schema/ingestion/generate",
      "METHOD": "POST",
      "API_ID": "obsrv.config.ingestion.generate"
    },


    "DATASET_SCHEMA": {
      "URL": "/schema/generate",
      "METHOD": "POST",
      "API_ID": "obsrv.config.schema.generate"
    },
  },

  "SYSTEM_SETTINGS": {
    "BASE_PATH": "/system",
    "API_VERSION": "/v2",
    "CONFIG_LABEL": {
      "URL": "/config/label",
      "METHOD": "GET",
      "API_ID": "obsrv.system.settings"
    },
  },


  "MANAGEMENT": {
    "BASE_PATH": "/manage",
    "API_VERSION": "/v2",
    "HEALTH": {
      "URL": "/health",
      "METHOD": "GET",
      "API_ID": "obsrv.manage.health"
    },
    "USAGE": {
      "URL": "/cluster/resource",
      "METHOD": "GET",
      "API_ID": "obsrv.manage.cluster.resource"
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
  },
  "DATASET_OPERATIONS": {
    "BASE_PATH": "/dataset",
    "API_VERSION": "/v2",
    "SAVE": {
      "URL": "/save",
      "METHOD": ["POST", "PATCH"],
      "API_ID": "obsrv.dataset.save"
    },
    "READ": {
      "URL": "/read",
      "METHOD": "GET",
      "API_ID": "obsrv.dataset.read"
    }
  },

  "DATASOURCE_OPERATIONS": {
    "BASE_PATH": "/datasource",
    "API_VERSION": "/v2",
    "SAVE": {
      "URL": "/save",
      "METHOD": ["POST", "PATCH"],
      "API_ID": "obsrv.datasource.save"
    },
    "READ": {
      "URL": "/read",
      "METHOD": "GET",
      "API_ID": "obsrv.datasource.read"
    }
  }
}


export default routes
