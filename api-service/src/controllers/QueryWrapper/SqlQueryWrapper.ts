import axios from "axios";
import { Request, Response } from "express";
import _ from "lodash";
import { config } from "../../configs/Config";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { ErrorObject } from "../../types/ResponseModel";

export const druidHttpService = axios.create({ baseURL: `${config.query_api.druid.host}:${config.query_api.druid.port}`, headers: { "Content-Type": "application/json" } });

const apiId = "api.obsrv.data.sql-query";
const errorCode = "SQL_QUERY_FAILURE"

export const sqlQuery = async (req: Request, res: Response) => {
    const resmsgid = _.get(res, "resmsgid");
    try {
        const authorization = _.get(req, ["headers", "authorization"]);

        if (_.isEmpty(req.body)) {
            const emptyBodyCode = "SQL_QUERY_EMPTY_REQUEST"
            logger.error({ code: emptyBodyCode, apiId, resmsgid, message: "Failed to query as request body is empty" })
            return ResponseHandler.errorResponse({
                code: emptyBodyCode,
                message: "Failed to query. Invalid request",
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const result = await druidHttpService.post(`${config.query_api.druid.sql_query_path}`, req.body, {
            headers: { Authorization: authorization },
        });

        logger.info({ messsge: "Successfully fetched data using sql query", apiId, resmsgid })
        ResponseHandler.flatResponse(req, res, result)
    } catch (error: any) {
        const code = _.get(error, "code") || errorCode
        const errorMessage = { message: _.get(error, "message") || "Failed to query to druid", code }
        logger.error(error, apiId, code, resmsgid)
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}