import axios from "axios";
import * as _ from "lodash";
import { config } from "../configs/Config";
const druidPort = _.get(config, "query_api.druid.port");
const druidHost = _.get(config, "query_api.druid.host");
const nativeQueryEndpoint = `${druidHost}:${druidPort}${config.query_api.druid.native_query_path}`;
const sqlQueryEndpoint = `${druidHost}:${druidPort}${config.query_api.druid.sql_query_path}`;

export const executeNativeQuery = async (payload: any) => {
    const queryResult = await axios.post(nativeQueryEndpoint, payload)
    return queryResult;
}

export const executeSqlQuery = async (payload: any) => {
    const queryResult = await axios.post(sqlQueryEndpoint, payload)
    return queryResult;
}

export const getDatasourceListFromDruid = async () => {
    const existingDatasources = await axios.get(`${config?.query_api?.druid?.host}:${config?.query_api?.druid?.port}${config.query_api.druid.list_datasources_path}`, {})
    return existingDatasources;
}

export const druidHttpService = axios.create({ baseURL: `${config.query_api.druid.host}:${config.query_api.druid.port}`, headers: { "Content-Type": "application/json" } });