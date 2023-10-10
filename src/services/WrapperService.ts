import axios from "axios";
import { NextFunction, Request, Response } from "express";
import errorResponse from "http-errors";
import httpStatus from "http-status";
import _ from "lodash";
import { config } from "../configs/Config";
import { ResponseHandler } from "../helpers/ResponseHandler";

export class WrapperService {
    constructor() { }

    private handleError = (error: any, next: NextFunction) => {
        console.error(error.message);
        console.log(error.data);
        next(errorResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message));
    };

    public forwardSql = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            // console.log("SQL Request to druid - \n" + JSON.stringify({"ts": Date.now(), body: req.body, headers: req.headers}));
            const authorization = req?.headers?.authorization;
            const result = await axios.post(
                `${config.query_api.druid.host}:${config.query_api.druid.port}${config.query_api.druid.sql_query_path}`,
                req.body, {
                headers: { Authorization: authorization },
            }
            );
            ResponseHandler.flatResponse(req, res, result);
        } catch (error: any) { this.handleError(error, next); }
    };

    public forwardNative = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            // console.log("Native POST Request to druid - \n" + JSON.stringify({"ts": Date.now(), body: req.body, headers: req.headers, url: req.url}));
            const headers = req?.headers;
            const url = req?.url;
            const result = await axios.post(
                `${config.query_api.druid.host}:${config.query_api.druid.port}${url}`,
                req.body, { headers, }
            );
            ResponseHandler.flatResponse(req, res, result);
        } catch (error: any) { this.handleError(error, next); }
    };

    public forwardNativeDel = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            // console.log("Native DEL Request to druid - \n" + JSON.stringify({"ts": Date.now(), body: req.body, headers: req.headers, url: req.url}));
            const headers = req?.headers;
            const url = req?.url;
            const result = await axios.delete(
                `${config.query_api.druid.host}:${config.query_api.druid.port}${url}`,
                {
                    headers,
                }
            );
            ResponseHandler.flatResponse(req, res, result);
        } catch (error: any) { this.handleError(error, next); }
    };

    public forwardNativeGet = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            // console.log("Native GET Request to druid - \n" + JSON.stringify({"ts": Date.now(), body: req.body, headers: req.headers, url: req.url}));
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
        } catch (error: any) { this.handleError(error, next); }
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
        } catch (error: any) { this.handleError(error, next); }
    };

    public submitIngestion = async (ingestionSpec: object) => {
        return await axios.post(`${config.query_api.druid.host}:${config.query_api.druid.port}/${config.query_api.druid.submit_ingestion}`, ingestionSpec)
     }
}
