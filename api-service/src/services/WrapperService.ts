import axios from "axios";
import { NextFunction, Request, Response } from "express";
import _ from "lodash";
import { config } from "../configs/Config";
import { ResponseHandler } from "../helpers/ResponseHandler";
import { ErrorResponseHandler } from "../helpers/ErrorResponseHandler";
import { Result } from "../models/DatasetModels";

import { AST, Parser } from 'node-sql-parser';
import { DbUtil } from "../helpers/DbUtil";
import { dbConnector } from "../routes/Router";
import { IConnector } from "../models/DatasetModels";
import NodeCache from 'node-cache';

export interface Datasource {
    dataset_id: string,
    datasource: number,
    datasource_ref: string,
}


export class WrapperService {
    private errorHandler: ErrorResponseHandler;
    private sqlParse: Parser;
    private dbConnector: any;
    private cache: NodeCache;
    private table: string = "datasources";
    constructor() {
        this.errorHandler = new ErrorResponseHandler("WrapperService");
        this.sqlParse = new Parser()
        this.dbConnector = dbConnector
        this.cache = new NodeCache();
    }



    public forwardNative = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            console.log("Native POST Request to druid - \n" + JSON.stringify({ "ts": Date.now(), body: req.body, headers: req.headers, url: req.url }));
            const headers = req?.headers;
            const url = req?.url;
            const result = await axios.post(
                `${config.query_api.druid.host}:${config.query_api.druid.port}${url}`,
                req.body, { headers, }
            );
            ResponseHandler.flatResponse(req, res, result);
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error); }
    };

    public forwardNativeDel = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            console.log("Native DEL Request to druid - \n" + JSON.stringify({ "ts": Date.now(), body: req.body, headers: req.headers, url: req.url }));
            const headers = req?.headers;
            const url = req?.url;
            const result = await axios.delete(
                `${config.query_api.druid.host}:${config.query_api.druid.port}${url}`,
                {
                    headers,
                }
            );

            ResponseHandler.flatResponse(req, res, result);
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false); }
    };

    public forwardNativeGet = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            console.log("Native GET Request to druid - \n" + JSON.stringify({ "ts": Date.now(), body: req.body, headers: req.headers, url: req.url }));
            const headers = req?.headers;
            const url = req?.url;
            const result = await axios.get(
                `${config.query_api.druid.host}:${config.query_api.druid.port}${url}`,
                {
                    headers,
                    data: req.body,
                }
            );
            ResponseHandler.flatResponse(req, res, result);
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false); }
    };

    public nativeStatus = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            // console.log("Native STATUS Request to druid - \n" + JSON.stringify({"ts": Date.now(), body: req.body, headers: req.headers, url: req.url}));
            const result = await axios.get(
                `${config.query_api.druid.host}:${config.query_api.druid.port}/status`
            );
            ResponseHandler.flatResponse(req, res, result);
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false); }
    };


    // Fake mock method
    public nativeGetDatasources = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const result = await axios.get(
                `${config.query_api.druid.host}:${config.query_api.druid.port}/druid/coordinator/v1/metadata/datasources`
            );
            ResponseHandler.flatResponse(req, res, { "data": [], "status": 200 });
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false); }
    };

    public submitIngestion = async (ingestionSpec: object) => {
        return await axios.post(`${config.query_api.druid.host}:${config.query_api.druid.port}/${config.query_api.druid.submit_ingestion}`, ingestionSpec)
    }


    public forwardSql = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            console.log("SQL Request to druid - \n" + JSON.stringify({ "ts": Date.now(), body: req.body, headers: req.headers }));
            const authorization = req?.headers?.authorization;
            const sqlQuery: string = req.body.query.toString();
            const tableList: string[] = this.sqlParse.tableList(sqlQuery)
            
            const tableNames = _.map(tableList, entry => _.last(entry.split('::')));
            const dbNames = _.map(tableList, entry => _.nth(_.split(entry, '::'), 1));

            if (_.includes(dbNames, "druid")) {
                    




            }
            
            
            
            
            const tableReplacements: { old: string, new: string }[] = [
                { old: "wikipedia", new: "wikipedia-1" },
                { old: "table2", new: "table3" }
            ];


            //const updatedQuery = this.updateTableNames(sqlQuery, tableReplacements);

            const result = await axios.post(
                `${config.query_api.druid.host}:${config.query_api.druid.port}${config.query_api.druid.sql_query_path}`,
                req.body, {
                headers: { Authorization: authorization },
            }
            );
            //console.log("result " + result)
            
            // if (sqlQuery && sqlQuery.trim() === "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'druid'") {
            //     result.data = this.dataSourcesIntercepter({ data: result.data, status: result.status }).data;
            // }
            ResponseHandler.flatResponse(req, res, result);
        } catch (error: any) {
            console.log("error" + error)
            this.errorHandler.handleError(req, res, next, error, false);
        }
    };


    public sqlQueryIntercepter(query: String): string {
        return ""
    }

    public dataSourcesIntercepter(response: Result): Result {
        return {
            data: this.getDataSources(),
            status: response.status
        };
    }


    private getDataSources(): Array<{ TABLE_NAME: string }> {
        // Fetch the data source list from the cache
        const datasources: string | undefined = this.cache.get<string>(this.table);
        // if (datasources) {
        //     const parsedData: { datasource: string }[] = JSON.parse(datasources);
        //     return parsedData.map((ds) => ({ TABLE_NAME: ds.datasource }));
        // } else {
        //     return [];
        // }

        return [{"TABLE_NAME": "wikipedia-1"}]
    }

    private updateTableNames = (query: string, replacements: { old: string, new: string }[]): string => {
        let updatedQuery = query;
        replacements.forEach(replacement => {
            const regex = new RegExp(`\\b${replacement.old}\\b`, 'g');
            updatedQuery = updatedQuery.replace(regex, replacement.new);
        });
        return updatedQuery;
    };

    private async executeQuery(): Promise<Datasource[]> {
        const data: any = await this.dbConnector.execute("read", {
            table: this.table,
            fields: {}
        });
        return data.map((item: any) => ({
            dataset_id: item.dataset_id,
            datasource: item.datasource,
            datasource_ref: item.datasource_ref
        }));
    }

    private async updateCache() {
        try {
            const result: Datasource[] = await this.executeQuery();
            this.cache.set(this.table, JSON.stringify(result));
            console.log('Cache updated:', result);
        } catch (error) {
            console.error('Error updating cache:', error);
        }
    }
}
