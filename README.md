# Obsrv API Service

## Overview

Obsrv is a set of APIs that provide access to a variety of data sources and datasets. These APIs can be used to query and analyze different types of events, as well as to manage data sources and datasets.

The following APIs are available in the Obsrv API service:

- Dataset APIs: These APIs allow you to interact with datasets, such as retrieving dataset metadata, creating new datasets, updating and list existing datasets.

- Datasource APIs: These APIs enable you to manage datasources. You can add new datasources, retrieve information about existing datasources, update and list all existing data sources.

- Dataset Source Config APIs: These APIs allow you to configure the sources for a dataset. You can add sources, update and retrieve the existing source configuration for a dataset.

- Data IN API: This API provides an interface to ingest data into the Obsrv system. You can use this API to send events to be stored and processed by Obsrv.

- Query APIs: These APIs allow you to query on different datasources. You can perform various types of queries, filter the results based on specific criteria, and retrieve the desired information.

## Dependencies

To use the Obsrv API service, make sure you have the following dependencies installed:

- Node.js: version 18
- TypeScript: version 4.8.4
- Express.js: version 4.18.2
- npm: version 9.6.4

## Getting Started

To start the Obsrv API service, follow these steps:

1. Install the required dependencies by running the following command:

```
npm install
```

2. Start the API service by running the following command:

```
npm run start
```

## Running Unit Tests

To run the unit tests for the Obsrv API service, execute the following command:

```
npm run test
```

After running the tests, the coverage files will be generated in the `coverage/` folder.


Default Configurations in API Settings:

These configurations can be modified as needed to customize the behavior of the system.

| Configuration            | Description                                                    | Default Value        |
|--------------------------|----------------------------------------------------------------|----------------------|
| system_env               | Environment in which the system is running.                     | local                |
| api_port                 | Port on which the API server should listen for incoming requests.| 3000                 |
| body_parser_limit        | Maximum size limit for parsing request bodies.                  | 100mb                |
| druid_host               | Hostname or IP address of the Druid server.                     | http://localhost     |
| druid_port               | Port number on which the Druid server is running.               | 8888                 |
| postgres_host            | Hostname or IP address of the PostgreSQL database server.       | localhost            |
| postgres_port            | Port number on which the PostgreSQL server is running.          | 5432                 |
| postgres_database        | Name of the PostgreSQL database to connect to.                  | sb-obsrv             |
| postgres_username        | Username to use when connecting to the PostgreSQL database.     | obsrv                |
| postgres_password        | Password to use when connecting to the PostgreSQL database.     | 5b-0b5rv            |
| kafka_host               | Hostname or IP address of the Kafka server.                     | localhost            |
| kafka_port               | Port number on which the Kafka server is running.               | 9092                 |
| client_id                | Client ID for authentication or identification purposes.        | obsrv-apis           |
| redis_host               | Hostname or IP address of the Redis server.                     | localhost            |
| redis_port               | Port number on which the Redis server is running.               | 6379                 |
| exclude_datasource_validation | List of datasource names that should be excluded from validation. | ["system-stats", "masterdata-system-stats"] |
| max_query_threshold      | Maximum threshold value for queries.                            | 5000                 |
| max_query_limit          | Maximum limit value for queries.                                | 5000                 |
| max_date_range           | Maximum date range value for queries                            | 30                   |