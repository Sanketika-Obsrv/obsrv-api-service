import { AxiosInstance } from "axios";
import { NextFunction, Request, Response } from "express";
import _ from "lodash";
import { config } from "../configs/Config";
import { ResponseHandler } from "../helpers/ResponseHandler";
import { IConnector } from "../models/DatasetModels";
import { ErrorResponseHandler } from "../helpers/ErrorResponseHandler";
import { updateTelemetryAuditEvent } from "./telemetry";
import { executeLakehouseQuery } from "../helpers/LakehouseUtil";
import { Datasources } from "../helpers/Datasources";


const telemetryObject = { id: null, type: "datasource", ver: "1.0.0" };

export class QueryService {
  private connector: AxiosInstance;
  private errorHandler: ErrorResponseHandler;
  private datasourceService = new Datasources({});
  constructor(connector: IConnector) {
    this.connector = connector.connect();
    this.errorHandler = new ErrorResponseHandler("QueryService");
  }

  public executeNativeQuery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      updateTelemetryAuditEvent({ request: req, object: { ...telemetryObject, id: _.get(req, 'body.context.dataSource') } });
      const datasource = _.get(req, ["body", "query", "dataSource"])
      await this.datasourceService.checkSupervisorAvailability(datasource)
      var result = await this.connector.post(config.query_api.druid.native_query_path, req.body.query);
      var mergedResult = result.data;
      if (req.body.query.queryType === "scan" && result.data) {
        mergedResult = result.data.map((item: Record<string, any>) => {
          return item.events;
        });
      }
      ResponseHandler.successResponse(req, res, { status: result.status, data: _.flatten(mergedResult) });

    } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false); }
  };

  public executeSqlQuery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let result: any = {}
      updateTelemetryAuditEvent({ request: req, object: { ...telemetryObject, id: _.get(req, 'body.context.dataSource') } });
      if (req.body?.context?.dataSourceType === config.query_api.lakehouse.queryType) {
        result.data = await executeLakehouseQuery(req.body.querySql.query)
      }
      else {
        const query = _.get(req, ["body", "querySql", "query"])
        const regex = /(?<=FROM\s+\")[^\"]+(?=\")/i;
        const source = query.match(regex);
        if (source) {
          const datasource: string = <string>_.head(source);
          await this.datasourceService.checkSupervisorAvailability(datasource)
        }
        result = await this.connector.post(config.query_api.druid.sql_query_path, req.body.querySql);
      }
      ResponseHandler.successResponse(req, res, { status: result.status || 200, data: result.data });
    } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false); }
  }
}
