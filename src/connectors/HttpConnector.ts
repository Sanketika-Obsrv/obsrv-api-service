import axios, { AxiosInstance } from "axios";
<<<<<<< HEAD
import { IConnector } from "../models/ingestionModels";
=======
import { IConnector } from "../models/DataSetModels";
>>>>>>> origin/ingestion-spec-generation
export class HTTPConnector implements IConnector {
  private url: string;
  constructor(url: string) {
    this.url = url
  }
  connect(): AxiosInstance {
    return axios.create({
      baseURL: this.url,
      timeout: 3000,
      headers: { "Content-Type": "application/json" }
    });
  }

  execute(sample: string) {
    throw new Error("Method not implemented.");
  }
  close() {
    throw new Error("Method not implemented.");
  }
  
}


