import axios, { AxiosInstance } from "axios";
export class HTTPConnector  {
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
  executeSql(sql: string[]) {
    throw new Error("Method not implemented.");
  }
  close() {
    throw new Error("Method not implemented.");
  }
  
}


