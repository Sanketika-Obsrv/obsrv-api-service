import axios, { AxiosInstance } from "axios";
import { IConnector } from "../models/DatasetModels";
import { getAuthorizationHeader } from "../helpers/getAuthrorizationHeader";
import { config } from "../configs/Config";


export class HTTPConnector implements IConnector {
  private url: string;
  private axiosInstance: AxiosInstance;
  constructor(url: string) {
    const request: any = {}
    request.headers = {
      "Content-Type": "application/json",
    }
    if(url === `${config.query_api.druid.host}:${config.query_api.druid.port}`){
      const customHeaders: any = getAuthorizationHeader()
      request.headers = Object.assign(request.headers, customHeaders)
    }
    this.url = url;
    this.axiosInstance = axios.create({
      baseURL: this.url,
      timeout: 3000,
      headers: request.headers
    });
  }

  connect(): AxiosInstance {
    return this.axiosInstance;
  }

  execute(sample: string) {
    throw new Error("Method not implemented.");
  }

  close() {
    throw new Error("Method not implemented.");
  }
}