import axios from "axios";
import _ from "lodash";
import { config } from "../configs/Config";
import { v4 } from "uuid";

const comandHost = _.get(config, ["command_service_config", "host"])
const commandPort = _.get(config, ["command_service_config", "port"])
const comandPath = _.get(config, ["command_service_config", "path"])

export const commandHttpService = axios.create({ baseURL: `${comandHost}:${commandPort}`, headers: { "Content-Type": "application/json" } });

export const executeCommand = async (id: string, command: string) => {
    const payload = {
        "id": v4(),
        "data": {
            "dataset_id": id,
            "command": command
        }
    }
    return commandHttpService.post(comandPath, payload)
}