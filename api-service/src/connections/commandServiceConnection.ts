import axios from "axios";
import _ from "lodash";
import { config } from "../configs/Config";
import { v4 } from "uuid";

const commandHost = _.get(config, ["command_service_config", "host"])
const commandPort = _.get(config, ["command_service_config", "port"])
const commandPaths = _.get(config, ["command_service_config", "paths"])
const datasetPath = _.get(commandPaths, ["dataset"])
const connectorRegisterPath = _.get(commandPaths, ["connector"])
const analyzePIIPath = _.get(commandPaths, ["analyzePII"])

export const commandHttpService = axios.create({ baseURL: `${commandHost}:${commandPort}`, headers: { "Content-Type": "application/json" } });

export const executeCommand = async (id: string, command: string, userToken: string) => {
    const payload = {
        "id": v4(),
        "data": {
            "dataset_id": id,
            "command": command
        }
    }
    return commandHttpService.post(datasetPath, payload, { headers: { Authorization: userToken }})
}

export const registerConnector = async (requestBody: any, userToken: string) => {
    return commandHttpService.post(connectorRegisterPath, requestBody, { headers: { Authorization: userToken }})
}

export const detectPII = async (requestBody: any, userToken: string) => {
    console.log(`analyzePIIPath : ${analyzePIIPath}`)
    return commandHttpService.post(analyzePIIPath, requestBody, { headers: { Authorization: userToken }})
}