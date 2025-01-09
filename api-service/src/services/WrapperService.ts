import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { config } from "../configs/Config";
import { ResponseHandler } from "../helpers/ResponseHandler";
import { ErrorResponseHandler } from "../helpers/ErrorResponseHandler";

class WrapperService {

    private errorHandler: ErrorResponseHandler;
    constructor() {
        this.errorHandler = new ErrorResponseHandler("WrapperService");
    }

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
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false); }
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
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error); }
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
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false); }
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
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false); }
    };

    public forwardNativeGetDatasource = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const headers = req?.headers;
            const url = req?.url;
            const result = await axios.get(
                `${config.query_api.druid.host}:${config.query_api.druid.port}${url}`,
                { headers }
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

    public submitIngestion = async (ingestionSpec: object) => {
        return await axios.post(`${config.query_api.druid.host}:${config.query_api.druid.port}/${config.query_api.druid.submit_ingestion}`, ingestionSpec)
    }

}

export const wrapperService = new WrapperService()