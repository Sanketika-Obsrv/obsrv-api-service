import httpStatus from "http-status";
import { DatasetStatus } from "../types/DatasetModels";

class TestDruidQuery {
  public static VALID_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"timeseries","dataSource":"telemetry-events","aggregations":[{"type":"count","name":"count"}],"granularity":"all","postAggregations":[],"intervals": "2021-02-19/2021-02-20"}}';
  public static HIGH_DATE_RANGE_GIVEN_AS_LIST =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"groupBy","dataSource":"telemetry-events","dimensions":["actor_type","content_framework"],"limit":15, "metric":"count","granularity":"all","intervals":["2021-01-02/2021-02-05"],"aggregations":[{"type":"count","name":"count"}]}}';
  public static HIGH_DATE_RANGE_GIVEN_AS_STRING =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"topN","dataSource":"telemetry-events","dimension":"actor_id","threshold":10,"metric":"count","granularity":"all","intervals":"2020-12-30/2021-02-02","aggregations":[{"type":"count","name":"count"}]}}';
  public static HIGH_THRESHOLD_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"scan","dataSource":"telemetry-events","dimension":"mid","threshold":1000,"metric":"count","granularity":"all","intervals":["2020-12-31/2021-01-01"],"aggregations":[]}}';
  public static HIGH_LIMIT_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"scan","dataSource":"telemetry-events","granularity":"all","intervals":["2020-12-21/2021-01-01"],"resultFormat":"compactedList","limit":1000,"columns":["actor_id", "mid"],"metrics":{"type":"numeric","metric":"count"},"aggregations":[{"type":"count","name":"count"}]}}';
  public static WITHOUT_THRESOLD_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"timeBoundary","dataSource":"telemetry-events","dimension":"content_status","metric":"count","granularity":"all","intervals":["2020-12-21/2020-12-22"],"aggregations":[]}}';
  public static WITHOUT_DATE_RANGE_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"search","dataSource":"telemetry-events","granularity":"all","intervals":"","resultFormat":"compactedList","columns":["__time"],"metrics":{"type":"numeric","metric":"count"},"aggregations":[{"type":"count","name":"count"}]}}';
  public static UNSUPPORTED_DATA_SOURCE =
    '{"context":{"dataSource":"invalid_data_source"},"query":{"queryType":"timeBoundary","dataSource":"invalid_data_source","granularity":"all","intervals":["2022-10-17/2022-10-19"],"resultFormat":"compactedList","columns":["__time","scans"],"metrics":{"type":"numeric","metric":"count"},"aggregations":[{"type":"count","name":"count"}]}}';
  public static INVALID_QUERY_TYPE =
    '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"invalidQueryType", "dataSource":"telemetry-events", "granularity":"all", "intervals":"2021-12-31/2022-01-20"}}';
  public static UNSUPPORTED_SCHEMA =
    '{"context":{},"query":{"queryType":"invalidQueryType", "dataSource":"telemetry-events", "granularity":"all", "intervals":"2021-12-31/2022-01-20"}}';
  public static VALID_SQL_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"querySql":{"query":"SELECT * FROM \\"telemetry-events\\" WHERE __time >= TIMESTAMP \'2020-12-31\' AND __time < TIMESTAMP \'2021-01-21\' LIMIT 10"}}';
  public static HIGH_LIMIT_SQL_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"querySql":{"query":"SELECT mid FROM \\"telemetry-events\\" WHERE __time >= TIMESTAMP \'2021-01-01\' AND __time < TIMESTAMP \'2021-01-22\' LIMIT 1000"}}';
  public static WITHOUT_LIMIT_SQL_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"querySql":{"query":"SELECT actor_type, content_status FROM \\"telemetry-events\\" WHERE __time >= TIMESTAMP \'2021-01-01\' AND __time < TIMESTAMP \'2021-01-02\'"}}';
  public static HIGH_DATE_RANGE_SQL_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"querySql":{"query":"SELECT actor_type, content_status FROM \\"telemetry-events\\" WHERE __time >= TIMESTAMP \'2021-01-01\' AND __time < TIMESTAMP \'2021-02-12\' LIMIT 10"}}';
  public static WITHOUT_DATE_RANGE_SQL_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"querySql":{"query":"SELECT content_status FROM \\"telemetry-events\\" LIMIT 5"}}';
  public static UNSUPPORTED_DATASOURCE_SQL_QUERY =
    '{"context":{"dataSource":"telemetry-events"},"querySql":{"query":"SELECT __time FROM \\"invalid-datasource\\" LIMIT 10"}}';
  public static SKIP_VALIDATION_NATIVE = '{"context":{"dataSource":"system-stats"},"query":{"queryType":"timeBoundary","dataSource":"system-stats","granularity":"all","intervals":["2022-10-17/2022-10-19"],"resultFormat":"compactedList","columns":["__time","scans"],"metrics":{"type":"numeric","metric":"count"},"aggregations":[{"type":"count","name":"count"}]}}';
  public static SKIP_VALIDATION_SQL = '{"context":{"dataSource":"failed-events-summary"},"querySql":{"query":"SELECT * FROM \\"failed-events-summary\\" WHERE __time >= TIMESTAMP \'2020-12-31\' AND __time < TIMESTAMP \'2021-01-21\' LIMIT 10"}}';
  public static INVALID_SQL_QUERY = '{\"context\":{\"dataSource\":\"system-events\",\"granularity\":\"day\"},\"querySql\":{\"query\":\"SELECT *  \"}}';
  public static MISSING_TABLE_NAME = '{\"context\":{\"dataSource\":\"system-events\",\"granularity\":\"day\"},\"querySql\":{\"query\":\"SELECT * FROM  \"}}';
}

export const VALID_DATASET = {
  "dataset_id": "sb-ddd",
  "type": "dataset",
  "name": "sb-telemetry2",
  "validation_config": {
    "validate": true,
    "mode": "Strict"
  },
  "dedup_config": {
    "drop_duplicates": true,
    "dedup_key": "mid"
  },
  "data_schema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "eid": {
        "type": "string"
      },
      "ver": {
        "type": "string"
      },
      "required": [
        "eid"
      ]
    },
    "additionalProperties": true
  },
  "denorm_config": {
    "denorm_fields": [
      {
        "denorm_key": "actor.id",
        "denorm_out_field": "userdata"
      }
    ]
  },
  "dataset_config": {
    "data_key": "",
    "timestamp_key": "ets"
  },
  "tags": []
}

export const VALID_MINIMAL_DATASET = {
  "dataset_id": "sb-ddd",
  "type": "dataset",
  "name": "sb-telemetry2",
  "data_schema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "eid": {
        "type": "string"
      },
      "ver": {
        "type": "string"
      },
      "required": [
        "eid"
      ]
    },
    "additionalProperties": true
  }
}

export const VALID_MINIMAL_MASTER_DATASET = {
  "dataset_id": "sb-ddd",
  "type": "master-dataset",
  "name": "sb-telemetry2",
  "data_schema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "eid": {
        "type": "string"
      },
      "ver": {
        "type": "string"
      },
      "required": [
        "eid"
      ]
    },
    "additionalProperties": true
  }
}

export const VALID_MORE_THAN_MINIMAL_DATASET = {
  "dataset_id": "sb-ddd",
  "type": "dataset",
  "name": "sb-telemetry2",
  "data_schema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "eid": {
        "type": "string"
      },
      "ver": {
        "type": "string"
      },
      "required": [
        "eid"
      ]
    },
    "additionalProperties": true
  }, "denorm_config": {
    "denorm_fields": [
      {
        "denorm_key": "actor.id",
        "denorm_out_field": "userdata"
      }
    ]
  },
  "dataset_config": {
    "data_key": "",
    "timestamp_key": "ets"
  },
}

export const VALID_MORE_THAN_MINIMAL_MASTER_DATASET = {
  "dataset_id": "sb-ddd",
  "type": "master-dataset",
  "name": "sb-telemetry2",
  "data_schema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "eid": {
        "type": "string"
      },
      "ver": {
        "type": "string"
      },
      "required": [
        "eid"
      ]
    },
    "additionalProperties": true
  }, "denorm_config": {
    "denorm_fields": [
      {
        "denorm_key": "actor.id",
        "denorm_out_field": "userdata"
      }
    ]
  },
  "dataset_config": {
    "data_key": "",
    "timestamp_key": "ets"
  },
}

export const VALID_MASTER_DATASET = {
  "id": "sb-telemetry2",
  "dataset_id": "sb-ddd",
  "type": "master-dataset",
  "name": "sb-telemetry2",
  "validation_config": {
    "validate": true,
    "mode": "Strict"
  },
  "dedup_config": {
    "drop_duplicates": true,
    "dedup_key": "mid"
  },
  "data_schema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "eid": {
        "type": "string"
      },
      "ver": {
        "type": "string"
      },
      "required": [
        "eid"
      ]
    },
    "additionalProperties": true
  },
  "denorm_config": {
    "denorm_fields": [
      {
        "denorm_key": "actor.id",
        "denorm_out_field": "userdata"
      }
    ]
  },
  "dataset_config": {
    "data_key": "",
    "timestamp_key": "ets"
  },
  "tags": []
}

export const SCHEMA_VALIDATION_ERROR_DATASET = {
  "dataset_id": 7
}

export const DATASET_WITH_DUPLICATE_DENORM_KEY = {
  "id": "sb-telemetry2",
  "dataset_id": "sb-ddd",
  "type": "dataset",
  "name": "sb-telemetry2",
  "data_schema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "eid": {
        "type": "string"
      },
      "ver": {
        "type": "string"
      },
      "required": [
        "eid"
      ]
    },
    "additionalProperties": true
  },
  "denorm_config": {
    "denorm_fields": [
      {
        "denorm_key": "actor.id",
        "denorm_out_field": "userdata"
      },
      {
        "denorm_key": "actor.id",
        "denorm_out_field": "userdata"
      }
    ]
  }
}

export const TestInputsForDatasetUpdate = {

  MINIMAL_DATASET_UPDATE_REQUEST: {
    "dataset_id": "telemetry",
    "name": "telemetry"
  },

  DATASET_UPDATE_TAG_ADD: {
    "dataset_id": "telemetry",
    "tags": [
      {
        "values": [
          "tag1",
          "tag2"
        ],
        "action": "add"
      }]
  },

  DATASET_UPDATE_TAG_REMOVE: {
    "dataset_id": "telemetry",
    "tags": [
      {
        "values": [
          "tag1",
          "tag2"
        ],
        "action": "remove"
      }]
  },

  DATASET_UPDATE_DENORM_ADD: {
    "dataset_id": "telemetry",
    "denorm_config": {
      "denorm_fields": [
        {
          "values": {
            "denorm_key": "actor.id",
            "denorm_out_field": "userdata"
          },
          "action": "add"
        }
      ]
    }
  },

  DATASET_UPDATE_DENORM_REMOVE: {
    "dataset_id": "telemetry",
    "denorm_config": {
      "denorm_fields": [
        {
          "values": {
            "denorm_key": "actor.id",
            "denorm_out_field": "userdata"
          },
          "action": "remove"
        }
      ]
    }
  },

  DATASET_UPDATE_TRANSFORMATIONS_ADD: {
    "dataset_id": "telemetry",
    "transformation_config": [
      {
        "values": {
          "field_key": "key1",
          "transformation_function": {},
          "mode": "Strict",
          "metadata": {}
        },
        "action": "add"
      }]
  },

  DATASET_UPDATE_DEDUP_DUPLICATES_TRUE: {
    "dataset_id": "telemetry",
    "dedup_config": {
      "drop_duplicates": true,
      "dedup_key": "mid"
    }
  },

  DATASET_UPDATE_EXTRACTION_DROP_DUPLICATES:{
    "dataset_id": "telemetry",
    "extraction_config":{
      "is_batch_event": true,
      "extraction_key": "events",
      "dedup_config": {
        "drop_duplicates": true,
        "dedup_key": "id"
      }
    }
  },

  DATASET_UPDATE_VALIDATION_VALIDATE:{
    "dataset_id": "telemetry",
    "validation_config":{
      "validate": true,
      "mode":"Strict"
    }
  },

  DATASET_UPDATE_DATA_SCHEMA_VALID:{
    "dataset_id": "telemetry",
    "data_schema": {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "eid": {
          "type": "string"
        },
        "ver": {
          "type": "string"
        },
        "required": [
          "eid"
        ]
      },
      "additionalProperties": true
    }
  },

  DATASET_UPDATE_DATASET_CONFIG_VALID:{
    "dataset_id": "telemetry",
    "dataset_config": {
      "data_key": "mid",
      "timestamp_key": "ets"
    }
  },

  DATASET_UPDATE_TRANSFORMATIONS_REMOVE: {
    "dataset_id": "telemetry",
    "transformation_config": [
      {
        "values": {
          "field_key": "key1",
          "transformation_function": {},
          "mode": "Strict",
          "metadata": {}
        },
        "action": "remove"
      }]
  },

  DATASET_UPDATE_TRANSFORMATIONS_UPDATE: {
    "dataset_id": "telemetry",
    "transformation_config": [
      {
        "values": {
          "field_key": "key1",
          "transformation_function": {},
          "mode": "Strict",
          "metadata": {}
        },
        "action": "update"
      }]
  },

  DATASET_UPDATE_REQUEST: {
    "dataset_id": "telemetry",
    "name": "sb-telemetry",
    "validation_config": {
      "validate": true,
      "mode": "Strict"
    },
    "extraction_config": {
      "is_batch_event": true,
      "extraction_key": "events",
      "dedup_config": {
        "drop_duplicates": true,
        "dedup_key": "id"
      }
    },
    "dedup_config": {
      "drop_duplicates": true,
      "dedup_key": "mid"
    },
    "data_schema": {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "eid": {
          "type": "string"
        },
        "ver": {
          "type": "string"
        },
        "required": [
          "eid"
        ]
      },
      "additionalProperties": true
    },
    "denorm_config": {
      "denorm_fields": [
        {
          "values": {
            "denorm_key": "actor.id",
            "denorm_out_field": "userdata"
          },
          "action": "add"
        },
        {
          "values": {
            "denorm_key": "actor.id",
            "denorm_out_field": "mid"
          },
          "action": "remove"
        }
      ]
    },
    "transformation_config": [
      {
        "values": {
          "field_key": "key1",
          "transformation_function": {},
          "mode": "Strict",
          "metadata": {}
        },
        "action": "add"
      },
      {
        "values": {
          "field_key": "key2",
          "transformation_function": {},
          "mode": "Strict",
          "metadata": {}
        },
        "action": "remove"
      },
      {
        "values": {
          "field_key": "key3",
          "transformation_function": {},
          "mode": "Strict",
          "metadata": {}
        },
        "action": "update"
      }
    ],
    "dataset_config": {
      "data_key": "mid",
      "timestamp_key": "ets"
    },
    "tags": [
      {
        "values": [
          "tag1",
          "tag2"
        ],
        "action": "remove"
      },
      {
        "values": [
          "tag3",
          "tag4"
        ],
        "action": "add"
      }
    ]
  },

  DATASET_UPDATE_DUPLICATE_DENORM_KEY: {
    "dataset_id": "telemetry",
    "denorm_config": {
      "denorm_fields": [
        {
          "values": {
            "denorm_key": "actor.id",
            "denorm_out_field": "userdata"
          },
          "action": "add"
        },
        {
          "values": {
            "denorm_key": "actor.id",
            "denorm_out_field": "userdata"
          },
          "action": "add"
        }
      ]
    }
  },

  DATASET_UPDATE_WITH_SAME_TAGS_ADD: {
    "dataset_id": "telemetry",
    "name": "sb-telemetry",
    "tags": [
      {
        "values": [
          "tag1",
          "tag1"
        ],
        "action": "remove"
      },
      {
        "values": [
          "tag4",
          "tag4"
        ],
        "action": "add"
      }
    ]
  },

  DATASET_UPDATE_WITH_SAME_DENORM_REMOVE: {
    "dataset_id": "telemetry",
    "name": "sb-telemetry",
    "denorm_config": {
      "denorm_fields": [
        {
          "values": {
            "denorm_key": "actor.id",
            "denorm_out_field": "mid"
          },
          "action": "remove"
        },
        {
          "values": {
            "denorm_key": "actor.id",
            "denorm_out_field": "mid"
          },
          "action": "remove"
        }
      ]
    }
  },

  DATASET_UPDATE_WITH_SAME_TRANSFORMATION_ADD_REMOVE: {
    "dataset_id": "telemetry",
    "name": "sb-telemetry",
    "transformation_config": [
      {
        "values": {
          "field_key": "key1",
          "transformation_function": {},
          "mode": "Strict",
          "metadata": {}
        },
        "action": "add"
      },
      {
        "values": {
          "field_key": "key1",
          "transformation_function": {},
          "mode": "Strict",
          "metadata": {}
        },
        "action": "add"
      },
      {
        "values": {
          "field_key": "key2",
          "transformation_function": {},
          "mode": "Strict",
          "metadata": {}
        },
        "action": "remove"
      },
      {
        "values": {
          "field_key": "key2",
          "transformation_function": {},
          "mode": "Strict",
          "metadata": {}
        },
        "action": "remove"
      },
      {
        "values": {
          "field_key": "key3",
          "transformation_function": {},
          "mode": "Strict",
          "metadata": {}
        },
        "action": "update"
      },
      {
        "values": {
          "field_key": "key3",
          "transformation_function": {},
          "mode": "Strict",
          "metadata": {}
        },
        "action": "update"
      }
    ]
  }
}

export const DATASET_CREATE_SUCCESS_FIXTURES = [
  {
    "title": "Dataset creation success: When all the request payload configs provided",
    "requestPayload": VALID_DATASET,
    "httpStatus": httpStatus.OK,
    "status": "SUCCESS"
  },
  {
    "title": "Master Dataset creation success: When all the request payload configs provided",
    "requestPayload": VALID_MASTER_DATASET,
    "httpStatus": httpStatus.OK,
    "status": "SUCCESS"
  },
  {
    "title": "Dataset creation success: When minimal request payload configs provided",
    "requestPayload": VALID_MINIMAL_DATASET,
    "httpStatus": httpStatus.OK,
    "status": "SUCCESS"
  },
  {
    "title": "Master Dataset creation success: When minimal request paylod configs provided",
    "requestPayload": VALID_MINIMAL_MASTER_DATASET,
    "httpStatus": httpStatus.OK,
    "status": "SUCCESS"
  },
  {
    "title": "Dataset creation success: When more than minimal request payload configs provided",
    "requestPayload": VALID_MORE_THAN_MINIMAL_DATASET,
    "httpStatus": httpStatus.OK,
    "status": "SUCCESS"
  },
  {
    "title": "Master Dataset creation success: When more than minimal request payload configs provided",
    "requestPayload": VALID_MORE_THAN_MINIMAL_MASTER_DATASET,
    "httpStatus": httpStatus.OK,
    "status": "SUCCESS"
  },
  {
    "title": "Dataset creation success: When id is not present in request payload and is generated using dataset_id",
    "requestPayload": VALID_MORE_THAN_MINIMAL_DATASET,
    "httpStatus": httpStatus.OK,
    "status": "SUCCESS"
  },
]

export const DATASET_FAILURE_DUPLICATE_DENORM_FIXTURES = [
  {
    "title": "Dataset creation failure: Dataset contains duplicate denorm out field",
    "requestPayload": DATASET_WITH_DUPLICATE_DENORM_KEY,
    "httpStatus": httpStatus.BAD_REQUEST,
    "status": "FAILED"
  },
  {
    "title": "Master Dataset creation failure: Dataset contains duplicate denorm out field",
    "requestPayload": { ...DATASET_WITH_DUPLICATE_DENORM_KEY, type: "master-dataset" },
    "httpStatus": httpStatus.BAD_REQUEST,
    "status": "FAILED"
  }
]

class TestDataIngestion {
  public static SAMPLE_INDIVIDUAL_EVENT = { "data": { "event": { "context": { "transaction_id": "3d3bac46-d252-4da0-9290-afdd524d0214", "country": "IND", "bpp_id": "becknify.humbhionline.in.mobility.BPP/beckn_open/app1-succinct-in", "city": "std:080", "message_id": "52dcf5a9-8986-47ff-a9d0-f380b23e3dfe", "core_version": "0.9.1", "ttl": "PT1M", "bap_id": "mobilityreferencebap.becknprotocol.io", "domain": "nic2004:60221", "bpp_uri": "https://becknify.humbhionline.in/mobility/beckn_open/app1-succinct-in/bpp", "action": "on_status", "bap_uri": "https://mobilityreferencebap.becknprotocol.io", "timestamp": "2023-02-22T19:06:27.887Z" }, "message": { "order": { "quote": { "breakup": [{ "price": { "currency": "INR", "value": "58.2936244525222" }, "type": "item", "title": "Fare" }, { "price": { "currency": "INR", "value": "10.492852401453995" }, "type": "item", "title": "Tax" }], "price": { "currency": "INR", "value": "68.7864768539762" } }, "provider": { "locations": [{ "gps": "12.973437,77.608771", "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.provider_location" }], "id": "./mobility/ind.blr/7@taxi.becknprotocol.io.provider", "descriptor": { "images": ["https://taxi.becknprotocol.io/companies/view/7"], "name": "Best Taxies" }, "categories": [{ "id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "descriptor": { "name": "Premium Taxi" } }], "items": [{ "category_id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "price": { "currency": "INR", "value": "68.7864768539762" }, "descriptor": { "images": ["https://taxi.becknprotocol.io/resources/images/car.png"], "code": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi", "name": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi" }, "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.item", "fulfillment_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "tags": { "NameOfModel": "Brezza", "VehicleType": "Premium Taxi", "Make": "Maruti", "FuelType": "Diesel" } }] }, "id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.order", "state": "Awaiting Driver acceptance", "fulfillment": { "agent": { "phone": "+919082233441", "name": "Michel MJ" }, "start": { "location": { "gps": "12.973437,77.608771" } }, "end": { "location": { "gps": "12.935193,77.624481" } }, "id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "vehicle": { "registration": "KA 05 3456" }, "customer": { "person": { "name": "./Rajat/Mr./Rajat/ /Kumar/" }, "contact": { "phone": "+919867654322", "email": "er.rjtkumar@gmail.com" } } }, "items": [{ "category_id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "price": { "currency": "INR", "value": "68.7864768539762" }, "descriptor": { "images": ["https://taxi.becknprotocol.io/resources/images/car.png"], "code": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi", "name": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi" }, "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.item", "fulfillment_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "tags": { "NameOfModel": "Brezza", "VehicleType": "Premium Taxi", "Make": "Maruti", "FuelType": "Diesel" } }], "billing": { "address": { "country": "IND", "door": "MBT", "city": "std:080", "area_code": "560078", "name": "RajatKumar", "locality": "", "building": ",A33" }, "phone": "+919867654322", "name": "./Rajat/Mr./Rajat/ /Kumar/", "email": "er.rjtkumar@gmail.com" } } } } } }
  public static SAMPLE_INPUT = { "data": { "id": "beckn-batch-1", "events": [{ "context": { "transaction_id": "3d3bac46-d252-4da0-9290-afdd524d0214", "country": "IND", "bpp_id": "becknify.humbhionline.in.mobility.BPP/beckn_open/app1-succinct-in", "city": "std:080", "message_id": "52dcf5a9-8986-47ff-a9d0-f380b23e3dfe", "core_version": "0.9.1", "ttl": "PT1M", "bap_id": "mobilityreferencebap.becknprotocol.io", "domain": "nic2004:60221", "bpp_uri": "https://becknify.humbhionline.in/mobility/beckn_open/app1-succinct-in/bpp", "action": "on_status", "bap_uri": "https://mobilityreferencebap.becknprotocol.io", "timestamp": "2023-02-22T19:06:27.887Z" }, "message": { "order": { "quote": { "breakup": [{ "price": { "currency": "INR", "value": "58.2936244525222" }, "type": "item", "title": "Fare" }, { "price": { "currency": "INR", "value": "10.492852401453995" }, "type": "item", "title": "Tax" }], "price": { "currency": "INR", "value": "68.7864768539762" } }, "provider": { "locations": [{ "gps": "12.973437,77.608771", "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.provider_location" }], "id": "./mobility/ind.blr/7@taxi.becknprotocol.io.provider", "descriptor": { "images": ["https://taxi.becknprotocol.io/companies/view/7"], "name": "Best Taxies" }, "categories": [{ "id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "descriptor": { "name": "Premium Taxi" } }], "items": [{ "category_id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "price": { "currency": "INR", "value": "68.7864768539762" }, "descriptor": { "images": ["https://taxi.becknprotocol.io/resources/images/car.png"], "code": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi", "name": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi" }, "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.item", "fulfillment_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "tags": { "NameOfModel": "Brezza", "VehicleType": "Premium Taxi", "Make": "Maruti", "FuelType": "Diesel" } }] }, "id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.order", "state": "Awaiting Driver acceptance", "fulfillment": { "agent": { "phone": "+919082233441", "name": "Michel MJ" }, "start": { "location": { "gps": "12.973437,77.608771" } }, "end": { "location": { "gps": "12.935193,77.624481" } }, "id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "vehicle": { "registration": "KA 05 3456" }, "customer": { "person": { "name": "./Rajat/Mr./Rajat/ /Kumar/" }, "contact": { "phone": "+919867654322", "email": "er.rjtkumar@gmail.com" } } }, "items": [{ "category_id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "price": { "currency": "INR", "value": "68.7864768539762" }, "descriptor": { "images": ["https://taxi.becknprotocol.io/resources/images/car.png"], "code": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi", "name": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi" }, "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.item", "fulfillment_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "tags": { "NameOfModel": "Brezza", "VehicleType": "Premium Taxi", "Make": "Maruti", "FuelType": "Diesel" } }], "billing": { "address": { "country": "IND", "door": "MBT", "city": "std:080", "area_code": "560078", "name": "RajatKumar", "locality": "", "building": ",A33" }, "phone": "+919867654322", "name": "./Rajat/Mr./Rajat/ /Kumar/", "email": "er.rjtkumar@gmail.com" } } } }, { "context": { "domain": "nic2004:60221", "country": "IND", "city": "std:080", "core_version": "0.9.1", "action": "track", "bap_id": "mobilityreferencebap.becknprotocol.io", "bap_uri": "https://mobilityreferencebap.becknprotocol.io", "bpp_id": "becknify.humbhionline.in.mobility.BPP/beckn_open/app1-succinct-in", "bpp_uri": "https://becknify.humbhionline.in/mobility/beckn_open/app1-succinct-in/bpp", "transaction_id": "3d3bac46-d252-4da0-9290-afdd524d0214", "message_id": "b52878f3-28ed-4c31-8ebb-8989f33c3220", "timestamp": "2023-02-22T19:07:07.887Z", "ttl": "PT1M" }, "message": { "order_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.order" } }] } }
}
class TestDataset {
  public static VALID_SCHEMA = { "type": "dataset", "dataset_id": "observations", "name": "telemetry-raw", "data_schema": { "type": "object", "properties": { "eid": { "type": "string" }, "ver": { "type": "string" }, "syncts": { "type": "integer" }, "ets": { "type": "integer" }, "mid": { "type": "string" }, "actor": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] }, "edata": { "type": "object", "properties": { "type": { "type": "string" } }, "required": ["type"] }, "@timestamp": { "type": "string" }, "context": { "type": "object", "properties": { "pdata": { "type": "object", "properties": { "ver": { "type": "string" }, "id": { "type": "string" }, "pid": { "type": "string" } }, "required": ["ver", "id", "pid"] }, "did": { "type": "string" }, "env": { "type": "string" }, "channel": { "type": "string" } }, "required": ["pdata", "did", "env", "channel"] }, "@version": { "type": "string" }, "object": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] } }, "required": ["eid", "ver", "syncts", "ets", "mid", "actor", "edata", "@timestamp", "context", "@version", "object"] }, "tags": [], "router_config": { "topic": "router.topic" }, "status": DatasetStatus.Live, "published_date": "2023-03-14T04:46:33.459Z" };
  public static VALID_SCHEMA_MASTER_DATASET = { "type": "master-dataset", "dataset_id": "3f8b2ba7-9c74-4d7f-8b38-2b0d460b999c", "name": "telemetry-raw", "data_schema": { "type": "object", "properties": { "eid": { "type": "string" }, "ver": { "type": "string" }, "syncts": { "type": "integer" }, "ets": { "type": "integer" }, "mid": { "type": "string" }, "actor": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] }, "edata": { "type": "object", "properties": { "type": { "type": "string" } }, "required": ["type"] }, "@timestamp": { "type": "string" }, "context": { "type": "object", "properties": { "pdata": { "type": "object", "properties": { "ver": { "type": "string" }, "id": { "type": "string" }, "pid": { "type": "string" } }, "required": ["ver", "id", "pid"] }, "did": { "type": "string" }, "env": { "type": "string" }, "channel": { "type": "string" } }, "required": ["pdata", "did", "env", "channel"] }, "@version": { "type": "string" }, "object": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] } }, "required": ["eid", "ver", "syncts", "ets", "mid", "actor", "edata", "@timestamp", "context", "@version", "object"] }, "tags": [], "router_config": { "topic": "router.topic" }, "status": DatasetStatus.Live, "published_date": "2023-03-14T04:46:33.459Z" }
  public static VALID_UPDATE_SCHEMA = { "type": "master-dataset", "dataset_id": "observations", "id": "observations", "name": "telemetry-raw", "data_schema": { "type": "object", "properties": { "eid": { "type": "string" }, "ver": { "type": "string" }, "syncts": { "type": "integer" }, "ets": { "type": "integer" }, "mid": { "type": "string" }, "actor": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] }, "edata": { "type": "object", "properties": { "type": { "type": "string" } }, "required": ["type"] }, "@timestamp": { "type": "string" }, "context": { "type": "object", "properties": { "pdata": { "type": "object", "properties": { "ver": { "type": "string" }, "id": { "type": "string" }, "pid": { "type": "string" } }, "required": ["ver", "id", "pid"] }, "did": { "type": "string" }, "env": { "type": "string" }, "channel": { "type": "string" } }, "required": ["pdata", "did", "env", "channel"] }, "@version": { "type": "string" }, "object": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] } }, "required": ["eid", "ver", "syncts", "ets", "mid", "actor", "edata", "@timestamp", "context", "@version", "object"] }, "router_config": { "topic": "router.topic" }, "tags": [], "status": DatasetStatus.Retired, "published_date": "2023-03-14T04:46:33.459Z" }
  public static INVALID_SCHEMA = { "dataset_id": "observations", "type": "dataset", "name": "observations", "router_config": { "topic": "" }, "data_schema": "string", "dataset_config": { "entry_topic": "local.ingest", "redis_db_host": "localhost", "redis_db_port": 6379 }, "status": DatasetStatus.Live, "published_date": "2023-03-24 12:19:32.091544" }
  public static MISSING_REQUIRED_FIELDS_CREATE = { "type": "dataset", "dataset_id": "observations", "name": "telemetry-raw", "data_schema": { "type": "object", "properties": { "eid": { "type": "string" }, "ver": { "type": "string" }, "syncts": { "type": "integer" }, "ets": { "type": "integer" }, "mid": { "type": "string" }, "actor": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] }, "edata": { "type": "object", "properties": { "type": { "type": "string" } }, "required": ["type"] }, "@timestamp": { "type": "string" }, "context": { "type": "object", "properties": { "pdata": { "type": "object", "properties": { "ver": { "type": "string" }, "id": { "type": "string" }, "pid": { "type": "string" } }, "required": ["ver", "id", "pid"] }, "did": { "type": "string" }, "env": { "type": "string" }, "channel": { "type": "string" } }, "required": ["pdata", "did", "env", "channel"] }, "@version": { "type": "string" }, "object": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] } }, "required": ["eid", "ver", "syncts", "ets", "mid", "actor", "edata", "@timestamp", "context", "@version", "object"] }, "status": DatasetStatus.Live, "published_date": "2023-03-14T04:46:33.459Z" };
  public static SAMPLE_ID = "observations";
  public static VALID_LIST_REQUEST_ACTIVE_STATUS = { "filters": { "status": [DatasetStatus.Live] } };
  public static VALID_LIST_REQUEST_DISABLED_STATUS = { "filters": { "status": [DatasetStatus.Retired] } };
  public static MISSING_REQUIRED_FIELDS_UPDATE = { "name": "telemetry-raw", "data_schema": { "type": "object", "properties": { "eid": { "type": "string" }, "ver": { "type": "string" }, "syncts": { "type": "integer" }, "ets": { "type": "integer" }, "mid": { "type": "string" }, "actor": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] }, "edata": { "type": "object", "properties": { "type": { "type": "string" } }, "required": ["type"] }, "@timestamp": { "type": "string" }, "context": { "type": "object", "properties": { "pdata": { "type": "object", "properties": { "ver": { "type": "string" }, "id": { "type": "string" }, "pid": { "type": "string" } }, "required": ["ver", "id", "pid"] }, "did": { "type": "string" }, "env": { "type": "string" }, "channel": { "type": "string" } }, "required": ["pdata", "did", "env", "channel"] }, "@version": { "type": "string" }, "object": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] } }, "required": ["eid", "ver", "syncts", "ets", "mid", "actor", "edata", "@timestamp", "context", "@version", "object"] }, "router_config": { "topic": "router.topic" }, "status": DatasetStatus.Live, "published_date": "2023-03-14T04:46:33.459Z" };
  public static VALID_RECORD = { "type": "master-dataset", "dataset_id": "3f8b2ba7-9c74-4d7f-8b38-2b0d460b999c", "id": "observations", "name": "telemetry-raw", " validation_config": { "validate": true, "mode": "Strict" }, "extraction_config": { "is_batch_event": false, "extraction_key": "", "dedup_config": { "drop_duplicates": true, "dedup_key": "id", "dedup_period": 3 } }, "dedup_config": { "drop_duplicates": true, "dedup_key": "id", "dedup_period": 3 }, "data_schema": { "type": "object", "properties": { "eid": { "type": "string" }, "ver": { "type": "string" }, "syncts": { "type": "integer" }, "ets": { "type": "integer" }, "mid": { "type": "string" }, "actor": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] }, "edata": { "type": "object", "properties": { "type": { "type": "string" } }, "required": ["type"] }, "@timestamp": { "type": "string" }, "context": { "type": "object", "properties": { "pdata": { "type": "object", "properties": { "ver": { "type": "string" }, "id": { "type": "string" }, "pid": { "type": "string" } }, "required": ["ver", "id", "pid"] }, "did": { "type": "string" }, "env": { "type": "string" }, "channel": { "type": "string" } }, "required": ["pdata", "did", "env", "channel"] }, "@version": { "type": "string" }, "object": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] } }, "required": ["eid", "ver", "syncts", "ets", "mid", "actor", "edata", "@timestamp", "context", "@version", "object"] }, "denorm_config": { "redis_db_host": "redis_host", "redis_db_port": "redis_port", "denorm_fields": [{ "denorm_key": "", "redis_db": 1, "denorm_out_field": "metadata" }] }, "tags": [], "router_config": { "topic": "router.topic" }, "client_state": {}, "status": DatasetStatus.Live, "created_by": "SYSTEM", "updated_by": "SYSTEM", "created_date": "2023-03-13T07:46:06.410Z", "updated_date": "2023-03-14T04:46:33.459Z", "published_date": "2023-03-14T04:46:33.459Z" };
  public static DUPLICATE_DENORM_OUT_FIELD = { "type": "master-dataset", "dataset_id": "3f8b2ba7-9c74-4d7f-8b38-2b0d460b999c", "id": "observations", "name": "telemetry-raw", " validation_config": { "validate": true, "mode": "Strict" }, "extraction_config": { "is_batch_event": false, "extraction_key": "", "dedup_config": { "drop_duplicates": true, "dedup_key": "id", "dedup_period": 3 } }, "dedup_config": { "drop_duplicates": true, "dedup_key": "id", "dedup_period": 3 }, "data_schema": { "type": "object", "properties": { "eid": { "type": "string" }, "ver": { "type": "string" }, "syncts": { "type": "integer" }, "ets": { "type": "integer" }, "mid": { "type": "string" }, "actor": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] }, "edata": { "type": "object", "properties": { "type": { "type": "string" } }, "required": ["type"] }, "@timestamp": { "type": "string" }, "context": { "type": "object", "properties": { "pdata": { "type": "object", "properties": { "ver": { "type": "string" }, "id": { "type": "string" }, "pid": { "type": "string" } }, "required": ["ver", "id", "pid"] }, "did": { "type": "string" }, "env": { "type": "string" }, "channel": { "type": "string" } }, "required": ["pdata", "did", "env", "channel"] }, "@version": { "type": "string" }, "object": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] } }, "required": ["eid", "ver", "syncts", "ets", "mid", "actor", "edata", "@timestamp", "context", "@version", "object"] }, "denorm_config": { "redis_db_host": "redis_host", "redis_db_port": "redis_port", "denorm_fields": [{ "denorm_key": "test", "redis_db": 1, "denorm_out_field": "metadata" }, { "denorm_key": "test", "redis_db": 1, "denorm_out_field": "metadata" }] }, "tags": [], "router_config": { "topic": "router.topic" }, "client_state": {}, "status": DatasetStatus.Live, "created_by": "SYSTEM", "updated_by": "SYSTEM", "created_date": "2023-03-13T07:46:06.410Z", "updated_date": "2023-03-14T04:46:33.459Z", "published_date": "2023-03-14T04:46:33.459Z" };
  public static VALID_DENORM_OUT_FIELD = { "type": "master-dataset", "dataset_id": "3f8b2ba7-9c74-4d7f-8b38-2b0d460b91ac", "id": "observctions", "name": "telemetay-raw", " validation_config": { "validate": true, "mode": "Strict" }, "extraction_config": { "is_batch_event": false, "extraction_key": "", "dedup_config": { "drop_duplicates": true, "dedup_key": "id", "dedup_period": 3 } }, "dedup_config": { "drop_duplicates": true, "dedup_key": "id", "dedup_period": 3 }, "data_schema": { "type": "object", "properties": { "eid": { "type": "string" }, "ver": { "type": "string" }, "syncts": { "type": "integer" }, "ets": { "type": "integer" }, "mid": { "type": "string" }, "actor": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] }, "edata": { "type": "object", "properties": { "type": { "type": "string" } }, "required": ["type"] }, "@timestamp": { "type": "string" }, "context": { "type": "object", "properties": { "pdata": { "type": "object", "properties": { "ver": { "type": "string" }, "id": { "type": "string" }, "pid": { "type": "string" } }, "required": ["ver", "id", "pid"] }, "did": { "type": "string" }, "env": { "type": "string" }, "channel": { "type": "string" } }, "required": ["pdata", "did", "env", "channel"] }, "@version": { "type": "string" }, "object": { "type": "object", "properties": { "id": { "type": "string" }, "type": { "type": "string" } }, "required": ["id", "type"] } }, "required": ["eid", "ver", "syncts", "ets", "mid", "actor", "edata", "@timestamp", "context", "@version", "object"] }, "denorm_config": { "redis_db_host": "redis_host", "redis_db_port": "redis_port", "denorm_fields": [{ "denorm_key": "test", "redis_db": 1, "denorm_out_field": "metadata2" }, { "denorm_key": "test", "redis_db": 1, "denorm_out_field": "metadata" }] }, "tags": [], "router_config": { "topic": "router.topic" }, "client_state": {}, "status": DatasetStatus.Live, "created_by": "SYSTEM", "updated_by": "SYSTEM", "created_date": "2023-03-13T07:46:06.410Z", "updated_date": "2023-03-14T04:46:33.459Z", "published_date": "2023-03-14T04:46:33.459Z" };
}

class TestDataSource {
  public static VALID_SCHEMA = { "dataset_id": "telemetry", "ingestion_spec": { "type": "kafka", "spec": { "dataSchema": { "dataSource": "telemetry-events", "dimensionsSpec": { "dimensions": [{ "type": "string", "name": "fromDate" }, { "type": "string", "name": "toDate" }, { "type": "string", "name": "tes" }, { "type": "string", "name": "uid" }, { "type": "string", "name": "mobile" }, { "type": "string", "name": "ip" }, { "type": "string", "name": "ipv6" }, { "type": "boolean", "name": "flags_ex_processed" }, { "type": "boolean", "name": "flags_pp_validation_processed" }, { "type": "boolean", "name": "flags_pp_duplicate_skipped" }, { "type": "boolean", "name": "flags_device_denorm" }, { "type": "boolean", "name": "flags_user_denorm" }, { "type": "boolean", "name": "flags_loc_denorm" }, { "type": "string", "name": "derivedlocationdata_district" }, { "type": "string", "name": "derivedlocationdata_from" }, { "type": "string", "name": "derivedlocationdata_state" }, { "type": "string", "name": "mid" }, { "type": "string", "name": "type" }, { "type": "string", "name": "actor_type" }, { "type": "string", "name": "actor_id" }, { "type": "string", "name": "edata_type" }, { "type": "string", "name": "edata_query" }, { "type": "string", "name": "edata_filters_slug" }, { "type": "boolean", "name": "edata_filters_isTenant" }, { "type": "string", "name": "edata_filters_make_type" }, { "type": "string", "name": "edata_topn[*]_id" }, { "name": "edata_items" }, { "type": "array", "name": "userdata_subject" }, { "type": "string", "name": "userdata_district" }, { "type": "string", "name": "userdata_usersubtype" }, { "type": "array", "name": "userdata_grade" }, { "type": "string", "name": "userdata_usersignintype" }, { "type": "string", "name": "userdata_usertype" }, { "type": "string", "name": "userdata_userlogintype" }, { "type": "string", "name": "userdata_state" }, { "type": "string", "name": "@timestamp" }, { "type": "string", "name": "devicedata_statecustomcode" }, { "type": "string", "name": "devicedata_country" }, { "type": "string", "name": "devicedata_iso3166statecode" }, { "type": "string", "name": "devicedata_city" }, { "type": "string", "name": "devicedata_countrycode" }, { "type": "string", "name": "devicedata_state" }, { "type": "string", "name": "devicedata_devicespec_idisk" }, { "type": "string", "name": "devicedata_devicespec_webview" }, { "type": "string", "name": "devicedata_devicespec_os" }, { "type": "string", "name": "devicedata_devicespec_scrn" }, { "type": "string", "name": "devicedata_devicespec_sims" }, { "type": "string", "name": "devicedata_devicespec_cpu" }, { "type": "string", "name": "devicedata_devicespec_id" }, { "type": "string", "name": "devicedata_devicespec_camera" }, { "type": "string", "name": "devicedata_devicespec_edisk" }, { "type": "string", "name": "devicedata_devicespec_make" }, { "type": "string", "name": "devicedata_statecode" }, { "type": "string", "name": "devicedata_districtcustom" }, { "type": "string", "name": "devicedata_statecustomname" }, { "type": "string", "name": "devicedata_userdeclared_district" }, { "type": "string", "name": "devicedata_userdeclared_state" }, { "type": "string", "name": "context_cdata[*]_id" }, { "type": "string", "name": "context_cdata[*]_type" }, { "type": "string", "name": "context_env" }, { "type": "string", "name": "context_channel" }, { "type": "string", "name": "context_pdata_id" }, { "type": "string", "name": "context_pdata_pid" }, { "type": "string", "name": "context_pdata_ver" }, { "type": "string", "name": "context_sid" }, { "type": "string", "name": "context_did" }, { "type": "string", "name": "context_rollup_l1" }, { "type": "string", "name": "object_id" }, { "type": "string", "name": "object_type" }, { "type": "string", "name": "object_version" }, { "type": "string", "name": "ver" }] }, "timestampSpec": { "column": "arrival-time", "format": "auto" }, "metricsSpec": [{ "type": "doubleSum", "name": "eid", "fieldName": "eid" }, { "type": "doubleSum", "name": "syncts", "fieldName": "syncts" }, { "type": "doubleSum", "name": "ets", "fieldName": "ets" }, { "type": "doubleSum", "name": "edata_duration", "fieldName": "edata_duration" }, { "type": "doubleSum", "name": "edata_size", "fieldName": "edata_size" }, { "type": "doubleSum", "name": "edata_filters_make_vers", "fieldName": "edata_filters_make_vers" }, { "type": "doubleSum", "name": "devicedata_firstaccess", "fieldName": "devicedata_firstaccess" }], "granularitySpec": { "type": "uniform", "segmentGranularity": "DAY", "queryGranularity": "HOUR", "rollup": false } }, "tuningConfig": { "type": "kafka", "maxRowsPerSegment": 50000, "logParseExceptions": true }, "ioConfig": { "type": "kafka", "topic": "telemetry", "consumerProperties": {}, "taskCount": 1, "replicas": 1, "taskDuration": "PT8H", "useEarliestOffset": false, "completionTimeout": "PT8H", "inputFormat": { "type": "json", "flattenSpec": { "useFieldDiscovery": true, "fields": [{ "type": "path", "expr": "$.eid", "name": "eid" }, { "type": "path", "expr": "$.syncts", "name": "syncts" }, { "type": "path", "expr": "$.ets", "name": "ets" }, { "type": "path", "expr": "$.edata.duration", "name": "edata_duration" }, { "type": "path", "expr": "$.edata.size", "name": "edata_size" }, { "type": "path", "expr": "$.edata.filters.make.vers", "name": "edata_filters_make_vers" }, { "type": "path", "expr": "$.devicedata.firstaccess", "name": "devicedata_firstaccess" }, { "type": "path", "expr": "$.flags.ex_processed", "name": "flags_ex_processed" }, { "type": "path", "expr": "$.flags.pp_validation_processed", "name": "flags_pp_validation_processed" }, { "type": "path", "expr": "$.flags.pp_duplicate_skipped", "name": "flags_pp_duplicate_skipped" }, { "type": "path", "expr": "$.flags.device_denorm", "name": "flags_device_denorm" }, { "type": "path", "expr": "$.flags.user_denorm", "name": "flags_user_denorm" }, { "type": "path", "expr": "$.flags.loc_denorm", "name": "flags_loc_denorm" }, { "type": "path", "expr": "$.derivedlocationdata.district", "name": "derivedlocationdata_district" }, { "type": "path", "expr": "$.derivedlocationdata.from", "name": "derivedlocationdata_from" }, { "type": "path", "expr": "$.derivedlocationdata.state", "name": "derivedlocationdata_state" }, { "type": "path", "expr": "$.mid", "name": "mid" }, { "type": "path", "expr": "$.type", "name": "type" }, { "type": "path", "expr": "$.actor.type", "name": "actor_type" }, { "type": "path", "expr": "$.actor.id", "name": "actor_id" }, { "type": "path", "expr": "$.edata.type", "name": "edata_type" }, { "type": "path", "expr": "$.edata.query", "name": "edata_query" }, { "type": "path", "expr": "$.edata.filters.slug", "name": "edata_filters_slug" }, { "type": "path", "expr": "$.edata.filters.isTenant", "name": "edata_filters_isTenant" }, { "type": "path", "expr": "$.edata.filters.make.type", "name": "edata_filters_make_type" }, { "type": "path", "expr": "$.edata.topn[*].id", "name": "edata_topn[*]_id" }, { "type": "path", "expr": "$.edata.items", "name": "edata_items" }, { "type": "path", "expr": "$.userdata.subject[*]", "name": "userdata_subject" }, { "type": "path", "expr": "$.userdata.district", "name": "userdata_district" }, { "type": "path", "expr": "$.userdata.usersubtype", "name": "userdata_usersubtype" }, { "type": "path", "expr": "$.userdata.grade[*]", "name": "userdata_grade" }, { "type": "path", "expr": "$.userdata.usersignintype", "name": "userdata_usersignintype" }, { "type": "path", "expr": "$.userdata.usertype", "name": "userdata_usertype" }, { "type": "path", "expr": "$.userdata.userlogintype", "name": "userdata_userlogintype" }, { "type": "path", "expr": "$.userdata.state", "name": "userdata_state" }, { "type": "path", "expr": "$.@timestamp", "name": "@timestamp" }, { "type": "path", "expr": "$.devicedata.statecustomcode", "name": "devicedata_statecustomcode" }, { "type": "path", "expr": "$.devicedata.country", "name": "devicedata_country" }, { "type": "path", "expr": "$.devicedata.iso3166statecode", "name": "devicedata_iso3166statecode" }, { "type": "path", "expr": "$.devicedata.city", "name": "devicedata_city" }, { "type": "path", "expr": "$.devicedata.countrycode", "name": "devicedata_countrycode" }, { "type": "path", "expr": "$.devicedata.state", "name": "devicedata_state" }, { "type": "path", "expr": "$.devicedata.devicespec.idisk", "name": "devicedata_devicespec_idisk" }, { "type": "path", "expr": "$.devicedata.devicespec.webview", "name": "devicedata_devicespec_webview" }, { "type": "path", "expr": "$.devicedata.devicespec.os", "name": "devicedata_devicespec_os" }, { "type": "path", "expr": "$.devicedata.devicespec.scrn", "name": "devicedata_devicespec_scrn" }, { "type": "path", "expr": "$.devicedata.devicespec.sims", "name": "devicedata_devicespec_sims" }, { "type": "path", "expr": "$.devicedata.devicespec.cpu", "name": "devicedata_devicespec_cpu" }, { "type": "path", "expr": "$.devicedata.devicespec.id", "name": "devicedata_devicespec_id" }, { "type": "path", "expr": "$.devicedata.devicespec.camera", "name": "devicedata_devicespec_camera" }, { "type": "path", "expr": "$.devicedata.devicespec.edisk", "name": "devicedata_devicespec_edisk" }, { "type": "path", "expr": "$.devicedata.devicespec.make", "name": "devicedata_devicespec_make" }, { "type": "path", "expr": "$.devicedata.statecode", "name": "devicedata_statecode" }, { "type": "path", "expr": "$.devicedata.districtcustom", "name": "devicedata_districtcustom" }, { "type": "path", "expr": "$.devicedata.statecustomname", "name": "devicedata_statecustomname" }, { "type": "path", "expr": "$.devicedata.userdeclared.district", "name": "devicedata_userdeclared_district" }, { "type": "path", "expr": "$.devicedata.userdeclared.state", "name": "devicedata_userdeclared_state" }, { "type": "path", "expr": "$.context.cdata[*].id", "name": "context_cdata[*]_id" }, { "type": "path", "expr": "$.context.cdata[*].type", "name": "context_cdata[*]_type" }, { "type": "path", "expr": "$.context.env", "name": "context_env" }, { "type": "path", "expr": "$.context.channel", "name": "context_channel" }, { "type": "path", "expr": "$.context.pdata.id", "name": "context_pdata_id" }, { "type": "path", "expr": "$.context.pdata.pid", "name": "context_pdata_pid" }, { "type": "path", "expr": "$.context.pdata.ver", "name": "context_pdata_ver" }, { "type": "path", "expr": "$.context.sid", "name": "context_sid" }, { "type": "path", "expr": "$.context.did", "name": "context_did" }, { "type": "path", "expr": "$.context.rollup.l1", "name": "context_rollup_l1" }, { "type": "path", "expr": "$.object.id", "name": "object_id" }, { "type": "path", "expr": "$.object.type", "name": "object_type" }, { "type": "path", "expr": "$.object.version", "name": "object_version" }, { "type": "path", "expr": "$.ver", "name": "ver" }] } }, "appendToExisting": false } } }, "datasource": "telemetry-events", "datasource_ref": "telemetry-events", "status": DatasetStatus.Retired, "published_date": "2023-03-14T04:46:33.459Z" };
  public static VALID_UPDATE_SCHEMA = { "id": "telemetry_telemetry-events", "dataset_id": "telemetry", "datasource": "telemetry-events", "backup_config": { "enabled": true }, "status": DatasetStatus.Live, "published_date": "2023-03-14T04:46:33.459Z", "datasource_ref": "telemetry-events" };
  public static INVALID_SCHEMA = { "dataset_id": "telemetry", "ingestion_spec": "invalid data type", "datasource": "telemetry-events", "status": DatasetStatus.Retired, "published_date": "2023-03-14T04:46:33.459Z", "datasource_ref": "telemetry-events", };
  public static INVALID_INPUT_TOPIC = { "id": "sb-telemetry_sb-telemetry", "datasource": "sb-telemetry", "dataset_id": "sb-telemetry", "ingestion_spec": { "type": "kafka", "spec": { "dataSchema": { "dataSource": "sb-telemetry.1_DAY", "dimensionsSpec": { "dimensions": [{ "type": "string", "name": "eid" }, { "type": "string", "name": "ver" }, { "type": "long", "name": "syncts" }, { "type": "boolean", "name": "flags_ex_processed" }, { "type": "boolean", "name": "flags_pp_validation_processed" }, { "type": "boolean", "name": "flags_pp_duplicate_skipped" }, { "type": "boolean", "name": "flags_user_denorm" }, { "type": "boolean", "name": "flags_device_denorm" }, { "type": "boolean", "name": "flags_loc_denorm" }, { "type": "boolean", "name": "flags_content_denorm" }, { "type": "boolean", "name": "flags_coll_denorm" }, { "type": "string", "name": "mid" }, { "type": "string", "name": "actor_id" }, { "type": "string", "name": "actor_type" }, { "type": "string", "name": "edata_type" }, { "type": "long", "name": "edata_duration" }, { "type": "string", "name": "edata_query" }, { "type": "array", "name": "edata_filters_objectType" }, { "type": "array", "name": "edata_filters_version" }, { "type": "array", "name": "edata_filters_status" }, { "type": "array", "name": "edata_filters_id" }, { "type": "boolean", "name": "edata_filters_isRootOrg" }, { "type": "string", "name": "edata_filters_trackable_enabled" }, { "type": "array", "name": "edata_filters_identifier" }, { "type": "array", "name": "edata_filters_contentType" }, { "type": "array", "name": "edata_filters_mimeType" }, { "type": "array", "name": "edata_filters_hashTagId" }, { "type": "string", "name": "edata_filters_createdBy" }, { "type": "array", "name": "edata_filters_mediaType" }, { "type": "string", "name": "edata_filters_origin" }, { "type": "array", "name": "edata_filters_primaryCategory" }, { "name": "edata_filters_trackable" }, { "type": "string", "name": "edata_sort_lastUpdatedOn" }, { "type": "array", "name": "edata_topn" }, { "type": "string", "name": "edata_pageid" }, { "type": "string", "name": "edata_uri" }, { "type": "string", "name": "edata_subtype" }, { "type": "string", "name": "edata_id" }, { "type": "string", "name": "edata_data" }, { "type": "string", "name": "edata_uaspec_agent" }, { "type": "string", "name": "edata_uaspec_ver" }, { "type": "string", "name": "edata_uaspec_system" }, { "type": "string", "name": "edata_uaspec_platform" }, { "type": "string", "name": "edata_uaspec_raw" }, { "type": "string", "name": "edata_state" }, { "type": "array", "name": "edata_props" }, { "type": "string", "name": "edata_prevstate" }, { "type": "string", "name": "edata_dspec_os" }, { "type": "string", "name": "edata_dspec_make" }, { "type": "string", "name": "edata_dspec_id" }, { "type": "long", "name": "edata_dspec_idisk" }, { "type": "long", "name": "edata_dspec_edisk" }, { "type": "long", "name": "edata_dspec_scrn" }, { "type": "string", "name": "edata_dspec_camera" }, { "type": "string", "name": "edata_dspec_cpu" }, { "type": "string", "name": "edata_dspec_webview" }, { "type": "array", "name": "edata_extra_pos" }, { "type": "array", "name": "edata_extra_values" }, { "type": "string", "name": "edata_extra_query" }, { "type": "string", "name": "edata_mode" }, { "type": "string", "name": "@timestamp" }, { "type": "string", "name": "context_channel" }, { "type": "string", "name": "context_pdata_id" }, { "type": "string", "name": "context_pdata_ver" }, { "type": "string", "name": "context_pdata_pid" }, { "type": "string", "name": "context_env" }, { "type": "string", "name": "context_sid" }, { "type": "string", "name": "context_rollup_l1" }, { "type": "string", "name": "context_rollup_l2" }, { "type": "string", "name": "context_rollup_l3" }, { "type": "array", "name": "context_cdata" }, { "type": "string", "name": "context_did" }, { "type": "string", "name": "context_uid" }, { "type": "string", "name": "object_id" }, { "type": "string", "name": "object_type" }, { "type": "string", "name": "object_ver" }, { "type": "string", "name": "object_rollup_l1" }, { "type": "string", "name": "object_version" }, { "type": "array", "name": "tags" }] }, "timestampSpec": { "column": "ets", "format": "auto" }, "metricsSpec": [{ "type": "doubleSum", "name": "edata_size", "fieldName": "edata_size" }, { "type": "doubleSum", "name": "edata_filters_compatibilityLevel_min", "fieldName": "edata_filters_compatibilityLevel_min" }, { "type": "doubleSum", "name": "edata_filters_compatibilityLevel_max", "fieldName": "edata_filters_compatibilityLevel_max" }, { "type": "doubleSum", "name": "edata_dspec_sims", "fieldName": "edata_dspec_sims" }], "granularitySpec": { "type": "uniform", "segmentGranularity": "DAY", "rollup": false } }, "tuningConfig": { "type": "kafka", "maxBytesInMemory": 134217728, "maxRowsPerSegment": 500000, "logParseExceptions": true }, "ioConfig": { "type": "kafka", "topic": "invalid_topic", "consumerProperties": { "bootstrap.servers": "kafka-headless.kafka.svc:9092" }, "taskCount": 1, "replicas": 1, "taskDuration": "PT1H", "useEarliestOffset": true, "completionTimeout": "PT1H", "inputFormat": { "type": "json", "flattenSpec": { "useFieldDiscovery": true, "fields": [{ "type": "path", "expr": "$.eid", "name": "eid" }, { "type": "path", "expr": "$.ver", "name": "ver" }, { "type": "path", "expr": "$.syncts", "name": "syncts" }, { "type": "path", "expr": "$.ets", "name": "ets" }, { "type": "path", "expr": "$.flags.ex_processed", "name": "flags_ex_processed" }, { "type": "path", "expr": "$.flags.pp_validation_processed", "name": "flags_pp_validation_processed" }, { "type": "path", "expr": "$.flags.pp_duplicate_skipped", "name": "flags_pp_duplicate_skipped" }, { "type": "path", "expr": "$.flags.user_denorm", "name": "flags_user_denorm" }, { "type": "path", "expr": "$.flags.device_denorm", "name": "flags_device_denorm" }, { "type": "path", "expr": "$.flags.loc_denorm", "name": "flags_loc_denorm" }, { "type": "path", "expr": "$.flags.content_denorm", "name": "flags_content_denorm" }, { "type": "path", "expr": "$.flags.coll_denorm", "name": "flags_coll_denorm" }, { "type": "path", "expr": "$.mid", "name": "mid" }, { "type": "path", "expr": "$.actor.id", "name": "actor_id" }, { "type": "path", "expr": "$.actor.type", "name": "actor_type" }, { "type": "path", "expr": "$.edata.type", "name": "edata_type" }, { "type": "path", "expr": "$.edata.duration", "name": "edata_duration" }, { "type": "path", "expr": "$.edata.query", "name": "edata_query" }, { "type": "path", "expr": "$.edata.filters.objectType[*]", "name": "edata_filters_objectType" }, { "type": "path", "expr": "$.edata.filters.version[*]", "name": "edata_filters_version" }, { "type": "path", "expr": "$.edata.filters.status[*]", "name": "edata_filters_status" }, { "type": "path", "expr": "$.edata.filters.id[*]", "name": "edata_filters_id" }, { "type": "path", "expr": "$.edata.filters.isRootOrg", "name": "edata_filters_isRootOrg" }, { "type": "path", "expr": "$.edata.filters.trackable.enabled", "name": "edata_filters_trackable_enabled" }, { "type": "path", "expr": "$.edata.filters.identifier[*]", "name": "edata_filters_identifier" }, { "type": "path", "expr": "$.edata.filters.contentType[*]", "name": "edata_filters_contentType" }, { "type": "path", "expr": "$.edata.filters.mimeType[*]", "name": "edata_filters_mimeType" }, { "type": "path", "expr": "$.edata.filters.hashTagId[*]", "name": "edata_filters_hashTagId" }, { "type": "path", "expr": "$.edata.filters.createdBy", "name": "edata_filters_createdBy" }, { "type": "path", "expr": "$.edata.filters.mediaType[*]", "name": "edata_filters_mediaType" }, { "type": "path", "expr": "$.edata.filters.origin", "name": "edata_filters_origin" }, { "type": "path", "expr": "$.edata.filters.primaryCategory[*]", "name": "edata_filters_primaryCategory" }, { "type": "path", "expr": "$.edata.filters.trackable", "name": "edata_filters_trackable" }, { "type": "path", "expr": "$.edata.sort.lastUpdatedOn", "name": "edata_sort_lastUpdatedOn" }, { "type": "path", "expr": "$.edata.topn[*]", "name": "edata_topn" }, { "type": "path", "expr": "$.edata.pageid", "name": "edata_pageid" }, { "type": "path", "expr": "$.edata.uri", "name": "edata_uri" }, { "type": "path", "expr": "$.edata.subtype", "name": "edata_subtype" }, { "type": "path", "expr": "$.edata.id", "name": "edata_id" }, { "type": "path", "expr": "$.edata.data", "name": "edata_data" }, { "type": "path", "expr": "$.edata.uaspec.agent", "name": "edata_uaspec_agent" }, { "type": "path", "expr": "$.edata.uaspec.ver", "name": "edata_uaspec_ver" }, { "type": "path", "expr": "$.edata.uaspec.system", "name": "edata_uaspec_system" }, { "type": "path", "expr": "$.edata.uaspec.platform", "name": "edata_uaspec_platform" }, { "type": "path", "expr": "$.edata.uaspec.raw", "name": "edata_uaspec_raw" }, { "type": "path", "expr": "$.edata.state", "name": "edata_state" }, { "type": "path", "expr": "$.edata.props[*]", "name": "edata_props" }, { "type": "path", "expr": "$.edata.prevstate", "name": "edata_prevstate" }, { "type": "path", "expr": "$.edata.dspec.os", "name": "edata_dspec_os" }, { "type": "path", "expr": "$.edata.dspec.make", "name": "edata_dspec_make" }, { "type": "path", "expr": "$.edata.dspec.id", "name": "edata_dspec_id" }, { "type": "path", "expr": "$.edata.dspec.idisk", "name": "edata_dspec_idisk" }, { "type": "path", "expr": "$.edata.dspec.edisk", "name": "edata_dspec_edisk" }, { "type": "path", "expr": "$.edata.dspec.scrn", "name": "edata_dspec_scrn" }, { "type": "path", "expr": "$.edata.dspec.camera", "name": "edata_dspec_camera" }, { "type": "path", "expr": "$.edata.dspec.cpu", "name": "edata_dspec_cpu" }, { "type": "path", "expr": "$.edata.dspec.webview", "name": "edata_dspec_webview" }, { "type": "path", "expr": "$.edata.extra.pos[*]", "name": "edata_extra_pos" }, { "type": "path", "expr": "$.edata.extra.values[*]", "name": "edata_extra_values" }, { "type": "path", "expr": "$.edata.extra.query", "name": "edata_extra_query" }, { "type": "path", "expr": "$.edata.mode", "name": "edata_mode" }, { "type": "path", "expr": "$.@timestamp", "name": "@timestamp" }, { "type": "path", "expr": "$.context.channel", "name": "context_channel" }, { "type": "path", "expr": "$.context.pdata.id", "name": "context_pdata_id" }, { "type": "path", "expr": "$.context.pdata.ver", "name": "context_pdata_ver" }, { "type": "path", "expr": "$.context.pdata.pid", "name": "context_pdata_pid" }, { "type": "path", "expr": "$.context.env", "name": "context_env" }, { "type": "path", "expr": "$.context.sid", "name": "context_sid" }, { "type": "path", "expr": "$.context.rollup.l1", "name": "context_rollup_l1" }, { "type": "path", "expr": "$.context.rollup.l2", "name": "context_rollup_l2" }, { "type": "path", "expr": "$.context.rollup.l3", "name": "context_rollup_l3" }, { "type": "path", "expr": "$.context.cdata[*]", "name": "context_cdata" }, { "type": "path", "expr": "$.context.did", "name": "context_did" }, { "type": "path", "expr": "$.context.uid", "name": "context_uid" }, { "type": "path", "expr": "$.object.id", "name": "object_id" }, { "type": "path", "expr": "$.object.type", "name": "object_type" }, { "type": "path", "expr": "$.object.ver", "name": "object_ver" }, { "type": "path", "expr": "$.object.rollup.l1", "name": "object_rollup_l1" }, { "type": "path", "expr": "$.object.version", "name": "object_version" }, { "type": "path", "expr": "$.tags[*]", "name": "tags" }, { "type": "path", "expr": "$.edata.size", "name": "edata_size" }, { "type": "path", "expr": "$.edata.filters.compatibilityLevel.min", "name": "edata_filters_compatibilityLevel_min" }, { "type": "path", "expr": "$.edata.filters.compatibilityLevel.max", "name": "edata_filters_compatibilityLevel_max" }, { "type": "path", "expr": "$.edata.dspec.sims", "name": "edata_dspec_sims" }] } }, "appendToExisting": false } } }, "datasource_ref": "sb-telemetry.1_DAY", "retention_period": { "enabled": "false" }, "archival_policy": { "enabled": "false" }, "purge_policy": { "enabled": "false" }, "backup_config": { "enabled": "false" }, "status": DatasetStatus.Live, "created_by": "SYSTEM", "updated_by": "SYSTEM", "published_date": "2023-07-03 00:00:00", "metadata": { "aggregated": false, "granularity": "day" } }
  public static INVALID_DATASOURCE_REF = { "id": "sb-telemetry_sb-telemetry", "datasource": "sb-telemetry", "dataset_id": "sb-telemetry", "ingestion_spec": { "type": "kafka", "spec": { "dataSchema": { "dataSource": "invalid_datasource", "dimensionsSpec": { "dimensions": [{ "type": "string", "name": "eid" }, { "type": "string", "name": "ver" }, { "type": "long", "name": "syncts" }, { "type": "boolean", "name": "flags_ex_processed" }, { "type": "boolean", "name": "flags_pp_validation_processed" }, { "type": "boolean", "name": "flags_pp_duplicate_skipped" }, { "type": "boolean", "name": "flags_user_denorm" }, { "type": "boolean", "name": "flags_device_denorm" }, { "type": "boolean", "name": "flags_loc_denorm" }, { "type": "boolean", "name": "flags_content_denorm" }, { "type": "boolean", "name": "flags_coll_denorm" }, { "type": "string", "name": "mid" }, { "type": "string", "name": "actor_id" }, { "type": "string", "name": "actor_type" }, { "type": "string", "name": "edata_type" }, { "type": "long", "name": "edata_duration" }, { "type": "string", "name": "edata_query" }, { "type": "array", "name": "edata_filters_objectType" }, { "type": "array", "name": "edata_filters_version" }, { "type": "array", "name": "edata_filters_status" }, { "type": "array", "name": "edata_filters_id" }, { "type": "boolean", "name": "edata_filters_isRootOrg" }, { "type": "string", "name": "edata_filters_trackable_enabled" }, { "type": "array", "name": "edata_filters_identifier" }, { "type": "array", "name": "edata_filters_contentType" }, { "type": "array", "name": "edata_filters_mimeType" }, { "type": "array", "name": "edata_filters_hashTagId" }, { "type": "string", "name": "edata_filters_createdBy" }, { "type": "array", "name": "edata_filters_mediaType" }, { "type": "string", "name": "edata_filters_origin" }, { "type": "array", "name": "edata_filters_primaryCategory" }, { "name": "edata_filters_trackable" }, { "type": "string", "name": "edata_sort_lastUpdatedOn" }, { "type": "array", "name": "edata_topn" }, { "type": "string", "name": "edata_pageid" }, { "type": "string", "name": "edata_uri" }, { "type": "string", "name": "edata_subtype" }, { "type": "string", "name": "edata_id" }, { "type": "string", "name": "edata_data" }, { "type": "string", "name": "edata_uaspec_agent" }, { "type": "string", "name": "edata_uaspec_ver" }, { "type": "string", "name": "edata_uaspec_system" }, { "type": "string", "name": "edata_uaspec_platform" }, { "type": "string", "name": "edata_uaspec_raw" }, { "type": "string", "name": "edata_state" }, { "type": "array", "name": "edata_props" }, { "type": "string", "name": "edata_prevstate" }, { "type": "string", "name": "edata_dspec_os" }, { "type": "string", "name": "edata_dspec_make" }, { "type": "string", "name": "edata_dspec_id" }, { "type": "long", "name": "edata_dspec_idisk" }, { "type": "long", "name": "edata_dspec_edisk" }, { "type": "long", "name": "edata_dspec_scrn" }, { "type": "string", "name": "edata_dspec_camera" }, { "type": "string", "name": "edata_dspec_cpu" }, { "type": "string", "name": "edata_dspec_webview" }, { "type": "array", "name": "edata_extra_pos" }, { "type": "array", "name": "edata_extra_values" }, { "type": "string", "name": "edata_extra_query" }, { "type": "string", "name": "edata_mode" }, { "type": "string", "name": "@timestamp" }, { "type": "string", "name": "context_channel" }, { "type": "string", "name": "context_pdata_id" }, { "type": "string", "name": "context_pdata_ver" }, { "type": "string", "name": "context_pdata_pid" }, { "type": "string", "name": "context_env" }, { "type": "string", "name": "context_sid" }, { "type": "string", "name": "context_rollup_l1" }, { "type": "string", "name": "context_rollup_l2" }, { "type": "string", "name": "context_rollup_l3" }, { "type": "array", "name": "context_cdata" }, { "type": "string", "name": "context_did" }, { "type": "string", "name": "context_uid" }, { "type": "string", "name": "object_id" }, { "type": "string", "name": "object_type" }, { "type": "string", "name": "object_ver" }, { "type": "string", "name": "object_rollup_l1" }, { "type": "string", "name": "object_version" }, { "type": "array", "name": "tags" }] }, "timestampSpec": { "column": "ets", "format": "auto" }, "metricsSpec": [{ "type": "doubleSum", "name": "edata_size", "fieldName": "edata_size" }, { "type": "doubleSum", "name": "edata_filters_compatibilityLevel_min", "fieldName": "edata_filters_compatibilityLevel_min" }, { "type": "doubleSum", "name": "edata_filters_compatibilityLevel_max", "fieldName": "edata_filters_compatibilityLevel_max" }, { "type": "doubleSum", "name": "edata_dspec_sims", "fieldName": "edata_dspec_sims" }], "granularitySpec": { "type": "uniform", "segmentGranularity": "DAY", "rollup": false } }, "tuningConfig": { "type": "kafka", "maxBytesInMemory": 134217728, "maxRowsPerSegment": 500000, "logParseExceptions": true }, "ioConfig": { "type": "kafka", "topic": "invalid_topic", "consumerProperties": { "bootstrap.servers": "kafka-headless.kafka.svc:9092" }, "taskCount": 1, "replicas": 1, "taskDuration": "PT1H", "useEarliestOffset": true, "completionTimeout": "PT1H", "inputFormat": { "type": "json", "flattenSpec": { "useFieldDiscovery": true, "fields": [{ "type": "path", "expr": "$.eid", "name": "eid" }, { "type": "path", "expr": "$.ver", "name": "ver" }, { "type": "path", "expr": "$.syncts", "name": "syncts" }, { "type": "path", "expr": "$.ets", "name": "ets" }, { "type": "path", "expr": "$.flags.ex_processed", "name": "flags_ex_processed" }, { "type": "path", "expr": "$.flags.pp_validation_processed", "name": "flags_pp_validation_processed" }, { "type": "path", "expr": "$.flags.pp_duplicate_skipped", "name": "flags_pp_duplicate_skipped" }, { "type": "path", "expr": "$.flags.user_denorm", "name": "flags_user_denorm" }, { "type": "path", "expr": "$.flags.device_denorm", "name": "flags_device_denorm" }, { "type": "path", "expr": "$.flags.loc_denorm", "name": "flags_loc_denorm" }, { "type": "path", "expr": "$.flags.content_denorm", "name": "flags_content_denorm" }, { "type": "path", "expr": "$.flags.coll_denorm", "name": "flags_coll_denorm" }, { "type": "path", "expr": "$.mid", "name": "mid" }, { "type": "path", "expr": "$.actor.id", "name": "actor_id" }, { "type": "path", "expr": "$.actor.type", "name": "actor_type" }, { "type": "path", "expr": "$.edata.type", "name": "edata_type" }, { "type": "path", "expr": "$.edata.duration", "name": "edata_duration" }, { "type": "path", "expr": "$.edata.query", "name": "edata_query" }, { "type": "path", "expr": "$.edata.filters.objectType[*]", "name": "edata_filters_objectType" }, { "type": "path", "expr": "$.edata.filters.version[*]", "name": "edata_filters_version" }, { "type": "path", "expr": "$.edata.filters.status[*]", "name": "edata_filters_status" }, { "type": "path", "expr": "$.edata.filters.id[*]", "name": "edata_filters_id" }, { "type": "path", "expr": "$.edata.filters.isRootOrg", "name": "edata_filters_isRootOrg" }, { "type": "path", "expr": "$.edata.filters.trackable.enabled", "name": "edata_filters_trackable_enabled" }, { "type": "path", "expr": "$.edata.filters.identifier[*]", "name": "edata_filters_identifier" }, { "type": "path", "expr": "$.edata.filters.contentType[*]", "name": "edata_filters_contentType" }, { "type": "path", "expr": "$.edata.filters.mimeType[*]", "name": "edata_filters_mimeType" }, { "type": "path", "expr": "$.edata.filters.hashTagId[*]", "name": "edata_filters_hashTagId" }, { "type": "path", "expr": "$.edata.filters.createdBy", "name": "edata_filters_createdBy" }, { "type": "path", "expr": "$.edata.filters.mediaType[*]", "name": "edata_filters_mediaType" }, { "type": "path", "expr": "$.edata.filters.origin", "name": "edata_filters_origin" }, { "type": "path", "expr": "$.edata.filters.primaryCategory[*]", "name": "edata_filters_primaryCategory" }, { "type": "path", "expr": "$.edata.filters.trackable", "name": "edata_filters_trackable" }, { "type": "path", "expr": "$.edata.sort.lastUpdatedOn", "name": "edata_sort_lastUpdatedOn" }, { "type": "path", "expr": "$.edata.topn[*]", "name": "edata_topn" }, { "type": "path", "expr": "$.edata.pageid", "name": "edata_pageid" }, { "type": "path", "expr": "$.edata.uri", "name": "edata_uri" }, { "type": "path", "expr": "$.edata.subtype", "name": "edata_subtype" }, { "type": "path", "expr": "$.edata.id", "name": "edata_id" }, { "type": "path", "expr": "$.edata.data", "name": "edata_data" }, { "type": "path", "expr": "$.edata.uaspec.agent", "name": "edata_uaspec_agent" }, { "type": "path", "expr": "$.edata.uaspec.ver", "name": "edata_uaspec_ver" }, { "type": "path", "expr": "$.edata.uaspec.system", "name": "edata_uaspec_system" }, { "type": "path", "expr": "$.edata.uaspec.platform", "name": "edata_uaspec_platform" }, { "type": "path", "expr": "$.edata.uaspec.raw", "name": "edata_uaspec_raw" }, { "type": "path", "expr": "$.edata.state", "name": "edata_state" }, { "type": "path", "expr": "$.edata.props[*]", "name": "edata_props" }, { "type": "path", "expr": "$.edata.prevstate", "name": "edata_prevstate" }, { "type": "path", "expr": "$.edata.dspec.os", "name": "edata_dspec_os" }, { "type": "path", "expr": "$.edata.dspec.make", "name": "edata_dspec_make" }, { "type": "path", "expr": "$.edata.dspec.id", "name": "edata_dspec_id" }, { "type": "path", "expr": "$.edata.dspec.idisk", "name": "edata_dspec_idisk" }, { "type": "path", "expr": "$.edata.dspec.edisk", "name": "edata_dspec_edisk" }, { "type": "path", "expr": "$.edata.dspec.scrn", "name": "edata_dspec_scrn" }, { "type": "path", "expr": "$.edata.dspec.camera", "name": "edata_dspec_camera" }, { "type": "path", "expr": "$.edata.dspec.cpu", "name": "edata_dspec_cpu" }, { "type": "path", "expr": "$.edata.dspec.webview", "name": "edata_dspec_webview" }, { "type": "path", "expr": "$.edata.extra.pos[*]", "name": "edata_extra_pos" }, { "type": "path", "expr": "$.edata.extra.values[*]", "name": "edata_extra_values" }, { "type": "path", "expr": "$.edata.extra.query", "name": "edata_extra_query" }, { "type": "path", "expr": "$.edata.mode", "name": "edata_mode" }, { "type": "path", "expr": "$.@timestamp", "name": "@timestamp" }, { "type": "path", "expr": "$.context.channel", "name": "context_channel" }, { "type": "path", "expr": "$.context.pdata.id", "name": "context_pdata_id" }, { "type": "path", "expr": "$.context.pdata.ver", "name": "context_pdata_ver" }, { "type": "path", "expr": "$.context.pdata.pid", "name": "context_pdata_pid" }, { "type": "path", "expr": "$.context.env", "name": "context_env" }, { "type": "path", "expr": "$.context.sid", "name": "context_sid" }, { "type": "path", "expr": "$.context.rollup.l1", "name": "context_rollup_l1" }, { "type": "path", "expr": "$.context.rollup.l2", "name": "context_rollup_l2" }, { "type": "path", "expr": "$.context.rollup.l3", "name": "context_rollup_l3" }, { "type": "path", "expr": "$.context.cdata[*]", "name": "context_cdata" }, { "type": "path", "expr": "$.context.did", "name": "context_did" }, { "type": "path", "expr": "$.context.uid", "name": "context_uid" }, { "type": "path", "expr": "$.object.id", "name": "object_id" }, { "type": "path", "expr": "$.object.type", "name": "object_type" }, { "type": "path", "expr": "$.object.ver", "name": "object_ver" }, { "type": "path", "expr": "$.object.rollup.l1", "name": "object_rollup_l1" }, { "type": "path", "expr": "$.object.version", "name": "object_version" }, { "type": "path", "expr": "$.tags[*]", "name": "tags" }, { "type": "path", "expr": "$.edata.size", "name": "edata_size" }, { "type": "path", "expr": "$.edata.filters.compatibilityLevel.min", "name": "edata_filters_compatibilityLevel_min" }, { "type": "path", "expr": "$.edata.filters.compatibilityLevel.max", "name": "edata_filters_compatibilityLevel_max" }, { "type": "path", "expr": "$.edata.dspec.sims", "name": "edata_dspec_sims" }] } }, "appendToExisting": false } } }, "datasource_ref": "sb-telemetry.1_DAY", "retention_period": { "enabled": "false" }, "archival_policy": { "enabled": "false" }, "purge_policy": { "enabled": "false" }, "backup_config": { "enabled": "false" }, "status": DatasetStatus.Live, "created_by": "SYSTEM", "updated_by": "SYSTEM", "published_date": "2023-07-03 00:00:00", "metadata": { "aggregated": false, "granularity": "day" } }
  public static MISSING_REQUIRED_FIELDS_CREATE = { "ingestion_spec": { "type": "kafka", "spec": { "dataSchema": { "dataSource": "telemetry-events", "dimensionsSpec": { "dimensions": [{ "type": "string", "name": "fromDate" }, { "type": "string", "name": "toDate" }, { "type": "string", "name": "tes" }, { "type": "string", "name": "uid" }, { "type": "string", "name": "mobile" }, { "type": "string", "name": "ip" }, { "type": "string", "name": "ipv6" }, { "type": "boolean", "name": "flags_ex_processed" }, { "type": "boolean", "name": "flags_pp_validation_processed" }, { "type": "boolean", "name": "flags_pp_duplicate_skipped" }, { "type": "boolean", "name": "flags_device_denorm" }, { "type": "boolean", "name": "flags_user_denorm" }, { "type": "boolean", "name": "flags_loc_denorm" }, { "type": "string", "name": "derivedlocationdata_district" }, { "type": "string", "name": "derivedlocationdata_from" }, { "type": "string", "name": "derivedlocationdata_state" }, { "type": "string", "name": "mid" }, { "type": "string", "name": "type" }, { "type": "string", "name": "actor_type" }, { "type": "string", "name": "actor_id" }, { "type": "string", "name": "edata_type" }, { "type": "string", "name": "edata_query" }, { "type": "string", "name": "edata_filters_slug" }, { "type": "boolean", "name": "edata_filters_isTenant" }, { "type": "string", "name": "edata_filters_make_type" }, { "type": "string", "name": "edata_topn[*]_id" }, { "name": "edata_items" }, { "type": "array", "name": "userdata_subject" }, { "type": "string", "name": "userdata_district" }, { "type": "string", "name": "userdata_usersubtype" }, { "type": "array", "name": "userdata_grade" }, { "type": "string", "name": "userdata_usersignintype" }, { "type": "string", "name": "userdata_usertype" }, { "type": "string", "name": "userdata_userlogintype" }, { "type": "string", "name": "userdata_state" }, { "type": "string", "name": "@timestamp" }, { "type": "string", "name": "devicedata_statecustomcode" }, { "type": "string", "name": "devicedata_country" }, { "type": "string", "name": "devicedata_iso3166statecode" }, { "type": "string", "name": "devicedata_city" }, { "type": "string", "name": "devicedata_countrycode" }, { "type": "string", "name": "devicedata_state" }, { "type": "string", "name": "devicedata_devicespec_idisk" }, { "type": "string", "name": "devicedata_devicespec_webview" }, { "type": "string", "name": "devicedata_devicespec_os" }, { "type": "string", "name": "devicedata_devicespec_scrn" }, { "type": "string", "name": "devicedata_devicespec_sims" }, { "type": "string", "name": "devicedata_devicespec_cpu" }, { "type": "string", "name": "devicedata_devicespec_id" }, { "type": "string", "name": "devicedata_devicespec_camera" }, { "type": "string", "name": "devicedata_devicespec_edisk" }, { "type": "string", "name": "devicedata_devicespec_make" }, { "type": "string", "name": "devicedata_statecode" }, { "type": "string", "name": "devicedata_districtcustom" }, { "type": "string", "name": "devicedata_statecustomname" }, { "type": "string", "name": "devicedata_userdeclared_district" }, { "type": "string", "name": "devicedata_userdeclared_state" }, { "type": "string", "name": "context_cdata[*]_id" }, { "type": "string", "name": "context_cdata[*]_type" }, { "type": "string", "name": "context_env" }, { "type": "string", "name": "context_channel" }, { "type": "string", "name": "context_pdata_id" }, { "type": "string", "name": "context_pdata_pid" }, { "type": "string", "name": "context_pdata_ver" }, { "type": "string", "name": "context_sid" }, { "type": "string", "name": "context_did" }, { "type": "string", "name": "context_rollup_l1" }, { "type": "string", "name": "object_id" }, { "type": "string", "name": "object_type" }, { "type": "string", "name": "object_version" }, { "type": "string", "name": "ver" }] }, "timestampSpec": { "column": "arrival-time", "format": "auto" }, "metricsSpec": [{ "type": "doubleSum", "name": "eid", "fieldName": "eid" }, { "type": "doubleSum", "name": "syncts", "fieldName": "syncts" }, { "type": "doubleSum", "name": "ets", "fieldName": "ets" }, { "type": "doubleSum", "name": "edata_duration", "fieldName": "edata_duration" }, { "type": "doubleSum", "name": "edata_size", "fieldName": "edata_size" }, { "type": "doubleSum", "name": "edata_filters_make_vers", "fieldName": "edata_filters_make_vers" }, { "type": "doubleSum", "name": "devicedata_firstaccess", "fieldName": "devicedata_firstaccess" }], "granularitySpec": { "type": "uniform", "segmentGranularity": "DAY", "queryGranularity": "HOUR", "rollup": false } }, "tuningConfig": { "type": "kafka", "maxRowsPerSegment": 50000, "logParseExceptions": true }, "ioConfig": { "type": "kafka", "topic": "telemetry", "consumerProperties": {}, "taskCount": 1, "replicas": 1, "taskDuration": "PT8H", "useEarliestOffset": false, "completionTimeout": "PT8H", "inputFormat": { "type": "json", "flattenSpec": { "useFieldDiscovery": true, "fields": [{ "type": "path", "expr": "$.eid", "name": "eid" }, { "type": "path", "expr": "$.syncts", "name": "syncts" }, { "type": "path", "expr": "$.ets", "name": "ets" }, { "type": "path", "expr": "$.edata.duration", "name": "edata_duration" }, { "type": "path", "expr": "$.edata.size", "name": "edata_size" }, { "type": "path", "expr": "$.edata.filters.make.vers", "name": "edata_filters_make_vers" }, { "type": "path", "expr": "$.devicedata.firstaccess", "name": "devicedata_firstaccess" }, { "type": "path", "expr": "$.flags.ex_processed", "name": "flags_ex_processed" }, { "type": "path", "expr": "$.flags.pp_validation_processed", "name": "flags_pp_validation_processed" }, { "type": "path", "expr": "$.flags.pp_duplicate_skipped", "name": "flags_pp_duplicate_skipped" }, { "type": "path", "expr": "$.flags.device_denorm", "name": "flags_device_denorm" }, { "type": "path", "expr": "$.flags.user_denorm", "name": "flags_user_denorm" }, { "type": "path", "expr": "$.flags.loc_denorm", "name": "flags_loc_denorm" }, { "type": "path", "expr": "$.derivedlocationdata.district", "name": "derivedlocationdata_district" }, { "type": "path", "expr": "$.derivedlocationdata.from", "name": "derivedlocationdata_from" }, { "type": "path", "expr": "$.derivedlocationdata.state", "name": "derivedlocationdata_state" }, { "type": "path", "expr": "$.mid", "name": "mid" }, { "type": "path", "expr": "$.type", "name": "type" }, { "type": "path", "expr": "$.actor.type", "name": "actor_type" }, { "type": "path", "expr": "$.actor.id", "name": "actor_id" }, { "type": "path", "expr": "$.edata.type", "name": "edata_type" }, { "type": "path", "expr": "$.edata.query", "name": "edata_query" }, { "type": "path", "expr": "$.edata.filters.slug", "name": "edata_filters_slug" }, { "type": "path", "expr": "$.edata.filters.isTenant", "name": "edata_filters_isTenant" }, { "type": "path", "expr": "$.edata.filters.make.type", "name": "edata_filters_make_type" }, { "type": "path", "expr": "$.edata.topn[*].id", "name": "edata_topn[*]_id" }, { "type": "path", "expr": "$.edata.items", "name": "edata_items" }, { "type": "path", "expr": "$.userdata.subject[*]", "name": "userdata_subject" }, { "type": "path", "expr": "$.userdata.district", "name": "userdata_district" }, { "type": "path", "expr": "$.userdata.usersubtype", "name": "userdata_usersubtype" }, { "type": "path", "expr": "$.userdata.grade[*]", "name": "userdata_grade" }, { "type": "path", "expr": "$.userdata.usersignintype", "name": "userdata_usersignintype" }, { "type": "path", "expr": "$.userdata.usertype", "name": "userdata_usertype" }, { "type": "path", "expr": "$.userdata.userlogintype", "name": "userdata_userlogintype" }, { "type": "path", "expr": "$.userdata.state", "name": "userdata_state" }, { "type": "path", "expr": "$.@timestamp", "name": "@timestamp" }, { "type": "path", "expr": "$.devicedata.statecustomcode", "name": "devicedata_statecustomcode" }, { "type": "path", "expr": "$.devicedata.country", "name": "devicedata_country" }, { "type": "path", "expr": "$.devicedata.iso3166statecode", "name": "devicedata_iso3166statecode" }, { "type": "path", "expr": "$.devicedata.city", "name": "devicedata_city" }, { "type": "path", "expr": "$.devicedata.countrycode", "name": "devicedata_countrycode" }, { "type": "path", "expr": "$.devicedata.state", "name": "devicedata_state" }, { "type": "path", "expr": "$.devicedata.devicespec.idisk", "name": "devicedata_devicespec_idisk" }, { "type": "path", "expr": "$.devicedata.devicespec.webview", "name": "devicedata_devicespec_webview" }, { "type": "path", "expr": "$.devicedata.devicespec.os", "name": "devicedata_devicespec_os" }, { "type": "path", "expr": "$.devicedata.devicespec.scrn", "name": "devicedata_devicespec_scrn" }, { "type": "path", "expr": "$.devicedata.devicespec.sims", "name": "devicedata_devicespec_sims" }, { "type": "path", "expr": "$.devicedata.devicespec.cpu", "name": "devicedata_devicespec_cpu" }, { "type": "path", "expr": "$.devicedata.devicespec.id", "name": "devicedata_devicespec_id" }, { "type": "path", "expr": "$.devicedata.devicespec.camera", "name": "devicedata_devicespec_camera" }, { "type": "path", "expr": "$.devicedata.devicespec.edisk", "name": "devicedata_devicespec_edisk" }, { "type": "path", "expr": "$.devicedata.devicespec.make", "name": "devicedata_devicespec_make" }, { "type": "path", "expr": "$.devicedata.statecode", "name": "devicedata_statecode" }, { "type": "path", "expr": "$.devicedata.districtcustom", "name": "devicedata_districtcustom" }, { "type": "path", "expr": "$.devicedata.statecustomname", "name": "devicedata_statecustomname" }, { "type": "path", "expr": "$.devicedata.userdeclared.district", "name": "devicedata_userdeclared_district" }, { "type": "path", "expr": "$.devicedata.userdeclared.state", "name": "devicedata_userdeclared_state" }, { "type": "path", "expr": "$.context.cdata[*].id", "name": "context_cdata[*]_id" }, { "type": "path", "expr": "$.context.cdata[*].type", "name": "context_cdata[*]_type" }, { "type": "path", "expr": "$.context.env", "name": "context_env" }, { "type": "path", "expr": "$.context.channel", "name": "context_channel" }, { "type": "path", "expr": "$.context.pdata.id", "name": "context_pdata_id" }, { "type": "path", "expr": "$.context.pdata.pid", "name": "context_pdata_pid" }, { "type": "path", "expr": "$.context.pdata.ver", "name": "context_pdata_ver" }, { "type": "path", "expr": "$.context.sid", "name": "context_sid" }, { "type": "path", "expr": "$.context.did", "name": "context_did" }, { "type": "path", "expr": "$.context.rollup.l1", "name": "context_rollup_l1" }, { "type": "path", "expr": "$.object.id", "name": "object_id" }, { "type": "path", "expr": "$.object.type", "name": "object_type" }, { "type": "path", "expr": "$.object.version", "name": "object_version" }, { "type": "path", "expr": "$.ver", "name": "ver" }] } }, "appendToExisting": false } } }, "datasource": "telemetry-events", "datasource_ref": "telemetry-events", "status": DatasetStatus.Live, "published_date": "2023-03-14T04:46:33.459Z" };
  public static MISSING_REQUIRED_FIELDS_UPDATE = { "dataset_id": "telemetry", "backup_config": { "enabled": true }, "status": DatasetStatus.Retired, "published_date": "2023-03-14T04:46:33.459Z" };
  public static SAMPLE_ID = "telemetry_telemetry-events";
  public static VALID_LIST_REQUEST_ACTIVE_STATUS = { "filters": { "status": [DatasetStatus.Live] } };
  public static VALID_LIST_REQUEST_DISABLED_STATUS = { "filters": { "status": [DatasetStatus.Retired] } };

  public static VALID_RECORD = { "dataset_id": "telemetry", "ingestion_spec": { "type": "kafka", "spec": { "dataSchema": { "dataSource": "telemetry-events", "dimensionsSpec": { "dimensions": [{ "type": "string", "name": "fromDate" }, { "type": "string", "name": "toDate" }, { "type": "string", "name": "tes" }, { "type": "string", "name": "uid" }, { "type": "string", "name": "mobile" }, { "type": "string", "name": "ip" }, { "type": "string", "name": "ipv6" }, { "type": "boolean", "name": "flags_ex_processed" }, { "type": "boolean", "name": "flags_pp_validation_processed" }, { "type": "boolean", "name": "flags_pp_duplicate_skipped" }, { "type": "boolean", "name": "flags_device_denorm" }, { "type": "boolean", "name": "flags_user_denorm" }, { "type": "boolean", "name": "flags_loc_denorm" }, { "type": "string", "name": "derivedlocationdata_district" }, { "type": "string", "name": "derivedlocationdata_from" }, { "type": "string", "name": "derivedlocationdata_state" }, { "type": "string", "name": "mid" }, { "type": "string", "name": "type" }, { "type": "string", "name": "actor_type" }, { "type": "string", "name": "actor_id" }, { "type": "string", "name": "edata_type" }, { "type": "string", "name": "edata_query" }, { "type": "string", "name": "edata_filters_slug" }, { "type": "boolean", "name": "edata_filters_isTenant" }, { "type": "string", "name": "edata_filters_make_type" }, { "type": "string", "name": "edata_topn[*]_id" }, { "name": "edata_items" }, { "type": "array", "name": "userdata_subject" }, { "type": "string", "name": "userdata_district" }, { "type": "string", "name": "userdata_usersubtype" }, { "type": "array", "name": "userdata_grade" }, { "type": "string", "name": "userdata_usersignintype" }, { "type": "string", "name": "userdata_usertype" }, { "type": "string", "name": "userdata_userlogintype" }, { "type": "string", "name": "userdata_state" }, { "type": "string", "name": "@timestamp" }, { "type": "string", "name": "devicedata_statecustomcode" }, { "type": "string", "name": "devicedata_country" }, { "type": "string", "name": "devicedata_iso3166statecode" }, { "type": "string", "name": "devicedata_city" }, { "type": "string", "name": "devicedata_countrycode" }, { "type": "string", "name": "devicedata_state" }, { "type": "string", "name": "devicedata_devicespec_idisk" }, { "type": "string", "name": "devicedata_devicespec_webview" }, { "type": "string", "name": "devicedata_devicespec_os" }, { "type": "string", "name": "devicedata_devicespec_scrn" }, { "type": "string", "name": "devicedata_devicespec_sims" }, { "type": "string", "name": "devicedata_devicespec_cpu" }, { "type": "string", "name": "devicedata_devicespec_id" }, { "type": "string", "name": "devicedata_devicespec_camera" }, { "type": "string", "name": "devicedata_devicespec_edisk" }, { "type": "string", "name": "devicedata_devicespec_make" }, { "type": "string", "name": "devicedata_statecode" }, { "type": "string", "name": "devicedata_districtcustom" }, { "type": "string", "name": "devicedata_statecustomname" }, { "type": "string", "name": "devicedata_userdeclared_district" }, { "type": "string", "name": "devicedata_userdeclared_state" }, { "type": "string", "name": "context_cdata[*]_id" }, { "type": "string", "name": "context_cdata[*]_type" }, { "type": "string", "name": "context_env" }, { "type": "string", "name": "context_channel" }, { "type": "string", "name": "context_pdata_id" }, { "type": "string", "name": "context_pdata_pid" }, { "type": "string", "name": "context_pdata_ver" }, { "type": "string", "name": "context_sid" }, { "type": "string", "name": "context_did" }, { "type": "string", "name": "context_rollup_l1" }, { "type": "string", "name": "object_id" }, { "type": "string", "name": "object_type" }, { "type": "string", "name": "object_version" }, { "type": "string", "name": "ver" }] }, "timestampSpec": { "column": "arrival-time", "format": "auto" }, "metricsSpec": [{ "type": "doubleSum", "name": "eid", "fieldName": "eid" }, { "type": "doubleSum", "name": "syncts", "fieldName": "syncts" }, { "type": "doubleSum", "name": "ets", "fieldName": "ets" }, { "type": "doubleSum", "name": "edata_duration", "fieldName": "edata_duration" }, { "type": "doubleSum", "name": "edata_size", "fieldName": "edata_size" }, { "type": "doubleSum", "name": "edata_filters_make_vers", "fieldName": "edata_filters_make_vers" }, { "type": "doubleSum", "name": "devicedata_firstaccess", "fieldName": "devicedata_firstaccess" }], "granularitySpec": { "type": "uniform", "segmentGranularity": "DAY", "queryGranularity": "HOUR", "rollup": false } }, "tuningConfig": { "type": "kafka", "maxRowsPerSegment": 50000, "logParseExceptions": true }, "ioConfig": { "type": "kafka", "topic": "telemetry", "consumerProperties": {}, "taskCount": 1, "replicas": 1, "taskDuration": "PT8H", "useEarliestOffset": false, "completionTimeout": "PT8H", "inputFormat": { "type": "json", "flattenSpec": { "useFieldDiscovery": true, "fields": [{ "type": "path", "expr": "$.eid", "name": "eid" }, { "type": "path", "expr": "$.syncts", "name": "syncts" }, { "type": "path", "expr": "$.ets", "name": "ets" }, { "type": "path", "expr": "$.edata.duration", "name": "edata_duration" }, { "type": "path", "expr": "$.edata.size", "name": "edata_size" }, { "type": "path", "expr": "$.edata.filters.make.vers", "name": "edata_filters_make_vers" }, { "type": "path", "expr": "$.devicedata.firstaccess", "name": "devicedata_firstaccess" }, { "type": "path", "expr": "$.flags.ex_processed", "name": "flags_ex_processed" }, { "type": "path", "expr": "$.flags.pp_validation_processed", "name": "flags_pp_validation_processed" }, { "type": "path", "expr": "$.flags.pp_duplicate_skipped", "name": "flags_pp_duplicate_skipped" }, { "type": "path", "expr": "$.flags.device_denorm", "name": "flags_device_denorm" }, { "type": "path", "expr": "$.flags.user_denorm", "name": "flags_user_denorm" }, { "type": "path", "expr": "$.flags.loc_denorm", "name": "flags_loc_denorm" }, { "type": "path", "expr": "$.derivedlocationdata.district", "name": "derivedlocationdata_district" }, { "type": "path", "expr": "$.derivedlocationdata.from", "name": "derivedlocationdata_from" }, { "type": "path", "expr": "$.derivedlocationdata.state", "name": "derivedlocationdata_state" }, { "type": "path", "expr": "$.mid", "name": "mid" }, { "type": "path", "expr": "$.type", "name": "type" }, { "type": "path", "expr": "$.actor.type", "name": "actor_type" }, { "type": "path", "expr": "$.actor.id", "name": "actor_id" }, { "type": "path", "expr": "$.edata.type", "name": "edata_type" }, { "type": "path", "expr": "$.edata.query", "name": "edata_query" }, { "type": "path", "expr": "$.edata.filters.slug", "name": "edata_filters_slug" }, { "type": "path", "expr": "$.edata.filters.isTenant", "name": "edata_filters_isTenant" }, { "type": "path", "expr": "$.edata.filters.make.type", "name": "edata_filters_make_type" }, { "type": "path", "expr": "$.edata.topn[*].id", "name": "edata_topn[*]_id" }, { "type": "path", "expr": "$.edata.items", "name": "edata_items" }, { "type": "path", "expr": "$.userdata.subject[*]", "name": "userdata_subject" }, { "type": "path", "expr": "$.userdata.district", "name": "userdata_district" }, { "type": "path", "expr": "$.userdata.usersubtype", "name": "userdata_usersubtype" }, { "type": "path", "expr": "$.userdata.grade[*]", "name": "userdata_grade" }, { "type": "path", "expr": "$.userdata.usersignintype", "name": "userdata_usersignintype" }, { "type": "path", "expr": "$.userdata.usertype", "name": "userdata_usertype" }, { "type": "path", "expr": "$.userdata.userlogintype", "name": "userdata_userlogintype" }, { "type": "path", "expr": "$.userdata.state", "name": "userdata_state" }, { "type": "path", "expr": "$.@timestamp", "name": "@timestamp" }, { "type": "path", "expr": "$.devicedata.statecustomcode", "name": "devicedata_statecustomcode" }, { "type": "path", "expr": "$.devicedata.country", "name": "devicedata_country" }, { "type": "path", "expr": "$.devicedata.iso3166statecode", "name": "devicedata_iso3166statecode" }, { "type": "path", "expr": "$.devicedata.city", "name": "devicedata_city" }, { "type": "path", "expr": "$.devicedata.countrycode", "name": "devicedata_countrycode" }, { "type": "path", "expr": "$.devicedata.state", "name": "devicedata_state" }, { "type": "path", "expr": "$.devicedata.devicespec.idisk", "name": "devicedata_devicespec_idisk" }, { "type": "path", "expr": "$.devicedata.devicespec.webview", "name": "devicedata_devicespec_webview" }, { "type": "path", "expr": "$.devicedata.devicespec.os", "name": "devicedata_devicespec_os" }, { "type": "path", "expr": "$.devicedata.devicespec.scrn", "name": "devicedata_devicespec_scrn" }, { "type": "path", "expr": "$.devicedata.devicespec.sims", "name": "devicedata_devicespec_sims" }, { "type": "path", "expr": "$.devicedata.devicespec.cpu", "name": "devicedata_devicespec_cpu" }, { "type": "path", "expr": "$.devicedata.devicespec.id", "name": "devicedata_devicespec_id" }, { "type": "path", "expr": "$.devicedata.devicespec.camera", "name": "devicedata_devicespec_camera" }, { "type": "path", "expr": "$.devicedata.devicespec.edisk", "name": "devicedata_devicespec_edisk" }, { "type": "path", "expr": "$.devicedata.devicespec.make", "name": "devicedata_devicespec_make" }, { "type": "path", "expr": "$.devicedata.statecode", "name": "devicedata_statecode" }, { "type": "path", "expr": "$.devicedata.districtcustom", "name": "devicedata_districtcustom" }, { "type": "path", "expr": "$.devicedata.statecustomname", "name": "devicedata_statecustomname" }, { "type": "path", "expr": "$.devicedata.userdeclared.district", "name": "devicedata_userdeclared_district" }, { "type": "path", "expr": "$.devicedata.userdeclared.state", "name": "devicedata_userdeclared_state" }, { "type": "path", "expr": "$.context.cdata[*].id", "name": "context_cdata[*]_id" }, { "type": "path", "expr": "$.context.cdata[*].type", "name": "context_cdata[*]_type" }, { "type": "path", "expr": "$.context.env", "name": "context_env" }, { "type": "path", "expr": "$.context.channel", "name": "context_channel" }, { "type": "path", "expr": "$.context.pdata.id", "name": "context_pdata_id" }, { "type": "path", "expr": "$.context.pdata.pid", "name": "context_pdata_pid" }, { "type": "path", "expr": "$.context.pdata.ver", "name": "context_pdata_ver" }, { "type": "path", "expr": "$.context.sid", "name": "context_sid" }, { "type": "path", "expr": "$.context.did", "name": "context_did" }, { "type": "path", "expr": "$.context.rollup.l1", "name": "context_rollup_l1" }, { "type": "path", "expr": "$.object.id", "name": "object_id" }, { "type": "path", "expr": "$.object.type", "name": "object_type" }, { "type": "path", "expr": "$.object.version", "name": "object_version" }, { "type": "path", "expr": "$.ver", "name": "ver" }] } }, "appendToExisting": false } } }, "datasource": "telemetry-events", "datasource_ref": "telemetry-events", "retention_period": {}, "archival_policy": {}, "purge_policy": {}, "backup_config": {}, "status": DatasetStatus.Live, "created_by": "SYSTEM", "updated_by": "SYSTEM", "created_date": "2023-03-15T20:45:04.737Z", "updated_date": "2023-03-15T20:45:04.733Z", "published_date": "2023-03-15T20:45:04.733Z", "metadata": { "aggregated": false, "granularity": "day" } }

}

class TestDatasetSourceConfig {
  public static VALID_SCHEMA = { "connector_type": "kafka", "dataset_id": "observations", "status": DatasetStatus.Live }
  public static VALID_UPDATE_SCHEMA = { "id": "observations_kafka", "connector_type": "kafka", "dataset_id": "observations", "status": DatasetStatus.Retired }
  public static INVALID_SCHEMA = { "connector_type": "kafka", "dataset_id": "observations", "status": {} }
  public static MISSING_REQUIRED_FIELDS_CREATE = { "connector_type": "kafka", "status": DatasetStatus.Live }
  public static SAMPLE_ID = "observations_kafka";
  public static VALID_LIST_REQUEST_ACTIVE_STATUS = { "filters": { "status": [DatasetStatus.Live] } };
  public static VALID_LIST_REQUEST_DISABLED_STATUS = { "filters": { "status": [DatasetStatus.Retired] } };
  public static MISSING_REQUIRED_FIELDS_UPDATE = { "connector_type": "kafka", "status": DatasetStatus.Live }
  public static VALID_RECORD = { "connector_type": "kafka", "dataset_id": "observations", "connector_config": {}, "status": DatasetStatus.Live, "connector_stats": {}, "created_by": "SYSTEM", "updated_by": "SYSTEM", "created_date": "2023-04-07T18:30:00.000Z", "updated_date": "2023-04-07T18:30:00.000Z" }
}

class TestExhaust {
  public static INVALID_DATE_RANGE = { "from": "20213-06-21", "to": "1234-12-12", "type": "transformed" };
  public static DATE_RANGE_OVER_LIMIT = { "from": "2023-06-01", "to": "2023-07-03", "type": "transformed" };
  public static VALID_REQUEST = { "from": "2023-06-01", "to": "2023-06-30", "type": "transformed" };
}

class TestSubmitIngestion {
  public static VALID_INGESTION_SPEC = {
    "type": "kafka",
    "spec": {
      "dataSchema": {
        "dataSource": "obsrv-telemetry-events",
        "dimensionsSpec": {
          "dimensions": []
        },
        "timestampSpec": {
          "column": "arrival-time",
          "format": "auto"
        },
        "metricsSpec": [],
        "granularitySpec": {
          "type": "uniform",
          "segmentGranularity": "DAY",
          "queryGranularity": "HOUR",
          "rollup": false
        }
      },
      "tuningConfig": {
        "type": "kafka",
        "maxRowsPerSegment": 50000,
        "logParseExceptions": true
      },
      "ioConfig": {
        "type": "kafka",
        "topic": "obsrv.telemetry.input",
        "consumerProperties": { "bootstrap.servers": "localhost:9092" },
        "taskCount": 1,
        "replicas": 1,
        "taskDuration": "PT8H",
        "useEarliestOffset": false,
        "completionTimeout": "PT8H",
        "inputFormat": {
          "type": "json",
          "flattenSpec": {
            "useFieldDiscovery": true,
            "fields": []
          }
        },
        "appendToExisting": false
      }
    }
  }
  public static INVALID_INGESTION_SPEC = {
    "type": "kafka",
    "spec": "ingestion_spec"
  }
}

const TestInputsForDataIngestion = {
  INVALID_REQUEST_BODY: {
    "event": {}
  },
  INDIVIDUAL_EVENT: {
    "data": {
      "event": {
        "eid": "INTERACT",
        "date": "2022-01-01",
        "ver": "3.0",
        "syncts": 1668591949682,
        "ets": 1668591949682
      }
    }
  },
  SAMPLE_INPUT_1: { "data": { "id": "batch", "events": [{ "context": { "transaction_id": "3d3bac46-d252-4da0-9290-afdd524d0214", "country": "IND", "bpp_id": "becknify.humbhionline.in.mobility.BPP/beckn_open/app1-succinct-in", "city": "std:080", "message_id": "52dcf5a9-8986-47ff-a9d0-f380b23e3dfe", "core_version": "0.9.1", "ttl": "PT1M", "bap_id": "mobilityreferencebap.becknprotocol.io", "domain": "nic2004:60221", "bpp_uri": "https://becknify.humbhionline.in/mobility/beckn_open/app1-succinct-in/bpp", "action": "on_status", "bap_uri": "https://mobilityreferencebap.becknprotocol.io", "timestamp": "2023-02-22T19:06:27.887Z" }, "message": { "order": { "quote": { "breakup": [{ "price": { "currency": "INR", "value": "58.2936244525222" }, "type": "item", "title": "Fare" }, { "price": { "currency": "INR", "value": "10.492852401453995" }, "type": "item", "title": "Tax" }], "price": { "currency": "INR", "value": "68.7864768539762" } }, "provider": { "locations": [{ "gps": "12.973437,77.608771", "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.provider_location" }], "id": "./mobility/ind.blr/7@taxi.becknprotocol.io.provider", "descriptor": { "images": ["https://taxi.becknprotocol.io/companies/view/7"], "name": "Best Taxies" }, "categories": [{ "id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "descriptor": { "name": "Premium Taxi" } }], "items": [{ "category_id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "price": { "currency": "INR", "value": "68.7864768539762" }, "descriptor": { "images": ["https://taxi.becknprotocol.io/resources/images/car.png"], "code": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi", "name": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi" }, "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.item", "fulfillment_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "tags": { "NameOfModel": "Brezza", "VehicleType": "Premium Taxi", "Make": "Maruti", "FuelType": "Diesel" } }] }, "id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.order", "state": "Awaiting Driver acceptance", "fulfillment": { "agent": { "phone": "+919082233441", "name": "Michel MJ" }, "start": { "location": { "gps": "12.973437,77.608771" } }, "end": { "location": { "gps": "12.935193,77.624481" } }, "id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "vehicle": { "registration": "KA 05 3456" }, "customer": { "person": { "name": "./Rajat/Mr./Rajat/ /Kumar/" }, "contact": { "phone": "+919867654322", "email": "er.rjtkumar@gmail.com" } } }, "items": [{ "category_id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "price": { "currency": "INR", "value": "68.7864768539762" }, "descriptor": { "images": ["https://taxi.becknprotocol.io/resources/images/car.png"], "code": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi", "name": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi" }, "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.item", "fulfillment_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "tags": { "NameOfModel": "Brezza", "VehicleType": "Premium Taxi", "Make": "Maruti", "FuelType": "Diesel" } }], "billing": { "address": { "country": "IND", "door": "MBT", "city": "std:080", "area_code": "560078", "name": "RajatKumar", "locality": "", "building": ",A33" }, "phone": "+919867654322", "name": "./Rajat/Mr./Rajat/ /Kumar/", "email": "er.rjtkumar@gmail.com" } } } }, { "context": { "domain": "nic2004:60221", "country": "IND", "city": "std:080", "core_version": "0.9.1", "action": "track", "bap_id": "mobilityreferencebap.becknprotocol.io", "bap_uri": "https://mobilityreferencebap.becknprotocol.io", "bpp_id": "becknify.humbhionline.in.mobility.BPP/beckn_open/app1-succinct-in", "bpp_uri": "https://becknify.humbhionline.in/mobility/beckn_open/app1-succinct-in/bpp", "transaction_id": "3d3bac46-d252-4da0-9290-afdd524d0214", "message_id": "b52878f3-28ed-4c31-8ebb-8989f33c3220", "timestamp": "2023-02-22T19:07:07.887Z", "ttl": "PT1M" }, "message": { "order_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.order" } }] } },
  SAMPLE_INPUT: { "data": { "id": "batch", "evId": [{ "context": { "transaction_id": "3d3bac46-d252-4da0-9290-afdd524d0214", "country": "IND", "bpp_id": "becknify.humbhionline.in.mobility.BPP/beckn_open/app1-succinct-in", "city": "std:080", "message_id": "52dcf5a9-8986-47ff-a9d0-f380b23e3dfe", "core_version": "0.9.1", "ttl": "PT1M", "bap_id": "mobilityreferencebap.becknprotocol.io", "domain": "nic2004:60221", "bpp_uri": "https://becknify.humbhionline.in/mobility/beckn_open/app1-succinct-in/bpp", "action": "on_status", "bap_uri": "https://mobilityreferencebap.becknprotocol.io", "timestamp": "2023-02-22T19:06:27.887Z" }, "message": { "order": { "quote": { "breakup": [{ "price": { "currency": "INR", "value": "58.2936244525222" }, "type": "item", "title": "Fare" }, { "price": { "currency": "INR", "value": "10.492852401453995" }, "type": "item", "title": "Tax" }], "price": { "currency": "INR", "value": "68.7864768539762" } }, "provider": { "locations": [{ "gps": "12.973437,77.608771", "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.provider_location" }], "id": "./mobility/ind.blr/7@taxi.becknprotocol.io.provider", "descriptor": { "images": ["https://taxi.becknprotocol.io/companies/view/7"], "name": "Best Taxies" }, "categories": [{ "id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "descriptor": { "name": "Premium Taxi" } }], "items": [{ "category_id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "price": { "currency": "INR", "value": "68.7864768539762" }, "descriptor": { "images": ["https://taxi.becknprotocol.io/resources/images/car.png"], "code": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi", "name": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi" }, "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.item", "fulfillment_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "tags": { "NameOfModel": "Brezza", "VehicleType": "Premium Taxi", "Make": "Maruti", "FuelType": "Diesel" } }] }, "id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.order", "state": "Awaiting Driver acceptance", "fulfillment": { "agent": { "phone": "+919082233441", "name": "Michel MJ" }, "start": { "location": { "gps": "12.973437,77.608771" } }, "end": { "location": { "gps": "12.935193,77.624481" } }, "id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "vehicle": { "registration": "KA 05 3456" }, "customer": { "person": { "name": "./Rajat/Mr./Rajat/ /Kumar/" }, "contact": { "phone": "+919867654322", "email": "er.rjtkumar@gmail.com" } } }, "items": [{ "category_id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "price": { "currency": "INR", "value": "68.7864768539762" }, "descriptor": { "images": ["https://taxi.becknprotocol.io/resources/images/car.png"], "code": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi", "name": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi" }, "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.item", "fulfillment_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "tags": { "NameOfModel": "Brezza", "VehicleType": "Premium Taxi", "Make": "Maruti", "FuelType": "Diesel" } }], "billing": { "address": { "country": "IND", "door": "MBT", "city": "std:080", "area_code": "560078", "name": "RajatKumar", "locality": "", "building": ",A33" }, "phone": "+919867654322", "name": "./Rajat/Mr./Rajat/ /Kumar/", "email": "er.rjtkumar@gmail.com" } } } }, { "context": { "domain": "nic2004:60221", "country": "IND", "city": "std:080", "core_version": "0.9.1", "action": "track", "bap_id": "mobilityreferencebap.becknprotocol.io", "bap_uri": "https://mobilityreferencebap.becknprotocol.io", "bpp_id": "becknify.humbhionline.in.mobility.BPP/beckn_open/app1-succinct-in", "bpp_uri": "https://becknify.humbhionline.in/mobility/beckn_open/app1-succinct-in/bpp", "transaction_id": "3d3bac46-d252-4da0-9290-afdd524d0214", "message_id": "b52878f3-28ed-4c31-8ebb-8989f33c3220", "timestamp": "2023-02-22T19:07:07.887Z", "ttl": "PT1M" }, "message": { "order_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.order" } }] } },
  INVALID_EXTRACTION_CONFIG: { "ids": "batch", "events": [{ "context": { "transaction_id": "3d3bac46-d252-4da0-9290-afdd524d0214", "country": "IND", "bpp_id": "becknify.humbhionline.in.mobility.BPP/beckn_open/app1-succinct-in", "city": "std:080", "message_id": "52dcf5a9-8986-47ff-a9d0-f380b23e3dfe", "core_version": "0.9.1", "ttl": "PT1M", "bap_id": "mobilityreferencebap.becknprotocol.io", "domain": "nic2004:60221", "bpp_uri": "https://becknify.humbhionline.in/mobility/beckn_open/app1-succinct-in/bpp", "action": "on_status", "bap_uri": "https://mobilityreferencebap.becknprotocol.io", "timestamp": "2023-02-22T19:06:27.887Z" }, "message": { "order": { "quote": { "breakup": [{ "price": { "currency": "INR", "value": "58.2936244525222" }, "type": "item", "title": "Fare" }, { "price": { "currency": "INR", "value": "10.492852401453995" }, "type": "item", "title": "Tax" }], "price": { "currency": "INR", "value": "68.7864768539762" } }, "provider": { "locations": [{ "gps": "12.973437,77.608771", "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.provider_location" }], "id": "./mobility/ind.blr/7@taxi.becknprotocol.io.provider", "descriptor": { "images": ["https://taxi.becknprotocol.io/companies/view/7"], "name": "Best Taxies" }, "categories": [{ "id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "descriptor": { "name": "Premium Taxi" } }], "items": [{ "category_id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "price": { "currency": "INR", "value": "68.7864768539762" }, "descriptor": { "images": ["https://taxi.becknprotocol.io/resources/images/car.png"], "code": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi", "name": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi" }, "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.item", "fulfillment_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "tags": { "NameOfModel": "Brezza", "VehicleType": "Premium Taxi", "Make": "Maruti", "FuelType": "Diesel" } }] }, "id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.order", "state": "Awaiting Driver acceptance", "fulfillment": { "agent": { "phone": "+919082233441", "name": "Michel MJ" }, "start": { "location": { "gps": "12.973437,77.608771" } }, "end": { "location": { "gps": "12.935193,77.624481" } }, "id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "vehicle": { "registration": "KA 05 3456" }, "customer": { "person": { "name": "./Rajat/Mr./Rajat/ /Kumar/" }, "contact": { "phone": "+919867654322", "email": "er.rjtkumar@gmail.com" } } }, "items": [{ "category_id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "price": { "currency": "INR", "value": "68.7864768539762" }, "descriptor": { "images": ["https://taxi.becknprotocol.io/resources/images/car.png"], "code": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi", "name": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi" }, "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.item", "fulfillment_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "tags": { "NameOfModel": "Brezza", "VehicleType": "Premium Taxi", "Make": "Maruti", "FuelType": "Diesel" } }], "billing": { "address": { "country": "IND", "door": "MBT", "city": "std:080", "area_code": "560078", "name": "RajatKumar", "locality": "", "building": ",A33" }, "phone": "+919867654322", "name": "./Rajat/Mr./Rajat/ /Kumar/", "email": "er.rjtkumar@gmail.com" } } } }, { "context": { "domain": "nic2004:60221", "country": "IND", "city": "std:080", "core_version": "0.9.1", "action": "track", "bap_id": "mobilityreferencebap.becknprotocol.io", "bap_uri": "https://mobilityreferencebap.becknprotocol.io", "bpp_id": "becknify.humbhionline.in.mobility.BPP/beckn_open/app1-succinct-in", "bpp_uri": "https://becknify.humbhionline.in/mobility/beckn_open/app1-succinct-in/bpp", "transaction_id": "3d3bac46-d252-4da0-9290-afdd524d0214", "message_id": "b52878f3-28ed-4c31-8ebb-8989f33c3220", "timestamp": "2023-02-22T19:07:07.887Z", "ttl": "PT1M" }, "message": { "order_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.order" } }] },
  VALID_CONFIG: { data: { "id": "batch", "events": [{ "context": { "transaction_id": "3d3bac46-d252-4da0-9290-afdd524d0214", "country": "IND", "bpp_id": "becknify.humbhionline.in.mobility.BPP/beckn_open/app1-succinct-in", "city": "std:080", "message_id": "52dcf5a9-8986-47ff-a9d0-f380b23e3dfe", "core_version": "0.9.1", "ttl": "PT1M", "bap_id": "mobilityreferencebap.becknprotocol.io", "domain": "nic2004:60221", "bpp_uri": "https://becknify.humbhionline.in/mobility/beckn_open/app1-succinct-in/bpp", "action": "on_status", "bap_uri": "https://mobilityreferencebap.becknprotocol.io", "timestamp": "2023-02-22T19:06:27.887Z" }, "message": { "order": { "quote": { "breakup": [{ "price": { "currency": "INR", "value": "58.2936244525222" }, "type": "item", "title": "Fare" }, { "price": { "currency": "INR", "value": "10.492852401453995" }, "type": "item", "title": "Tax" }], "price": { "currency": "INR", "value": "68.7864768539762" } }, "provider": { "locations": [{ "gps": "12.973437,77.608771", "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.provider_location" }], "id": "./mobility/ind.blr/7@taxi.becknprotocol.io.provider", "descriptor": { "images": ["https://taxi.becknprotocol.io/companies/view/7"], "name": "Best Taxies" }, "categories": [{ "id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "descriptor": { "name": "Premium Taxi" } }], "items": [{ "category_id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "price": { "currency": "INR", "value": "68.7864768539762" }, "descriptor": { "images": ["https://taxi.becknprotocol.io/resources/images/car.png"], "code": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi", "name": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi" }, "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.item", "fulfillment_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "tags": { "NameOfModel": "Brezza", "VehicleType": "Premium Taxi", "Make": "Maruti", "FuelType": "Diesel" } }] }, "id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.order", "state": "Awaiting Driver acceptance", "fulfillment": { "agent": { "phone": "+919082233441", "name": "Michel MJ" }, "start": { "location": { "gps": "12.973437,77.608771" } }, "end": { "location": { "gps": "12.935193,77.624481" } }, "id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "vehicle": { "registration": "KA 05 3456" }, "customer": { "person": { "name": "./Rajat/Mr./Rajat/ /Kumar/" }, "contact": { "phone": "+919867654322", "email": "er.rjtkumar@gmail.com" } } }, "items": [{ "category_id": "./mobility/ind.blr/1@taxi.becknprotocol.io.category", "price": { "currency": "INR", "value": "68.7864768539762" }, "descriptor": { "images": ["https://taxi.becknprotocol.io/resources/images/car.png"], "code": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi", "name": "Premium Taxi-FuelType:Diesel,Make:Maruti,NameOfModel:Brezza,VehicleType:Premium Taxi" }, "id": "./mobility/ind.blr/17@taxi.becknprotocol.io.item", "fulfillment_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.fulfillment", "tags": { "NameOfModel": "Brezza", "VehicleType": "Premium Taxi", "Make": "Maruti", "FuelType": "Diesel" } }], "billing": { "address": { "country": "IND", "door": "MBT", "city": "std:080", "area_code": "560078", "name": "RajatKumar", "locality": "", "building": ",A33" }, "phone": "+919867654322", "name": "./Rajat/Mr./Rajat/ /Kumar/", "email": "er.rjtkumar@gmail.com" } } } }, { "context": { "domain": "nic2004:60221", "country": "IND", "city": "std:080", "core_version": "0.9.1", "action": "track", "bap_id": "mobilityreferencebap.becknprotocol.io", "bap_uri": "https://mobilityreferencebap.becknprotocol.io", "bpp_id": "becknify.humbhionline.in.mobility.BPP/beckn_open/app1-succinct-in", "bpp_uri": "https://becknify.humbhionline.in/mobility/beckn_open/app1-succinct-in/bpp", "transaction_id": "3d3bac46-d252-4da0-9290-afdd524d0214", "message_id": "b52878f3-28ed-4c31-8ebb-8989f33c3220", "timestamp": "2023-02-22T19:07:07.887Z", "ttl": "PT1M" }, "message": { "order_id": "./mobility/ind.blr/6285@taxi.becknprotocol.io.order" } }] } },
  EXTRACTION_NOT_FOUND: {
    "data": {
      "eventsId": {
      },
      "batchId": {

      }
    }
  }
}

export { TestDruidQuery, TestDataIngestion, TestDataset, TestDataSource, TestDatasetSourceConfig, TestExhaust, TestSubmitIngestion, TestInputsForDataIngestion };