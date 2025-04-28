import { Request, Response } from "express";
import _ from "lodash";
import { config } from "../../configs/Config";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { ErrorObject } from "../../types/ResponseModel";
import { druidHttpService } from "../../connections/druidConnection";
import { getDatasourceList } from "../../services/DatasourceService";
import { AxiosResponse } from "axios";

const apiId = "api.obsrv.data.sql-query";
const errorCode = "SQL_QUERY_FAILURE"
export const result_data = {"data": {}};

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
        const query = req.body.query as string;
        let result: AxiosResponse;
        if (isTableSchemaQuery(query)) {
            const dataSources = await fetchDruidDataSources();
            result = createMockAxiosResponse(dataSources);
        } else {
            result = await druidHttpService.post(`${config.query_api.druid.sql_query_path}`, req.body, {
                headers: { Authorization: authorization },
            });
        }
        _.set(result_data, "data", result.data);
        logger.info({ messsge: "Successfully fetched data using sql query", apiId, resmsgid })
        ResponseHandler.flatResponse(req, res, result)
    } catch (error: any) {
        const code = _.get(error, "code") || errorCode
        const errorMessage = { message: _.get(error, "message") || "Failed to query to druid", code }
        logger.error(error, apiId, code, resmsgid)
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const fetchDruidDataSources = async (): Promise<{ TABLE_NAME: string }[]> => {
    try {
        const dataSources = await getDatasourceList();
        return dataSources
            .filter((ds: any) => ds.type === "druid")
            .map((ds: any) => ({ TABLE_NAME: ds.dataValues.datasource_ref }));
    } catch (error) {
        logger.error({ message: "Failed to fetch Druid data sources", error });
        throw new Error("Failed to fetch Druid data sources");
    }
};

const isTableSchemaQuery = (sqlQuery?: string): boolean => {
    return (
      sqlQuery
        ?.trim()
        .replace(/\s+/g, " ")
        .toUpperCase() ===
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'DRUID'"
    );
  };
  

const createMockAxiosResponse = (data: any): AxiosResponse => {
    return {
        data,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
    } as AxiosResponse;
};
