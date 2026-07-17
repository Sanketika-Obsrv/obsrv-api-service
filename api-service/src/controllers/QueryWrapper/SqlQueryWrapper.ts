import { Request, Response } from "express";
import _ from "lodash";
import { config } from "../../configs/Config";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { ErrorObject } from "../../types/ResponseModel";
import { druidHttpService } from "../../connections/druidConnection";
import { getDatasourceList, getLiveDatasourcesByNames } from "../../services/DatasourceService";
import { AxiosResponse } from "axios";
import { Parser } from "node-sql-parser";
import { collectCteNames, collectTableEntries } from "../../services/SqlQueryService";

const apiId = "api.obsrv.data.sql-query";
const errorCode = "SQL_QUERY_FAILURE"
export const result_data = { "data": {} };
const parser = new Parser();

// Rewrites table names to datasource_refs ONLY when a name matches a datasource
// alias that is not itself already a datasource_ref. Any other case (name already
// a datasource_ref, name unknown, parse failure) returns the ORIGINAL query
// string verbatim so nothing about the pydruid/Superset request is altered.
const resolveDatasourceQuery = async (query: string, resmsgid?: string): Promise<string> => {
    try {
        if (!_.isString(query) || _.isEmpty(query)) return query;

        let ast: any;
        try {
            ast = parser.astify(query, { database: "postgresql" });
        } catch {
            // node-sql-parser can't parse this SQL (Druid-specific syntax etc.) -> pass through untouched.
            logger.info({ apiId, resmsgid, message: "Query not parseable for alias check, passing query as-is" });
            return query;
        }
        if (_.isArray(ast)) {
            logger.info({ apiId, resmsgid, message: "Multi-statement query, passing query as-is" });
            return query; // multi-statement -> leave as-is
        }

        const fromList = collectTableEntries(ast, collectCteNames(ast));
        const tableNames = _.uniq(_.map(fromList, (e) => e.table).filter(_.isString));
        if (_.isEmpty(tableNames)) {
            logger.info({ apiId, resmsgid, message: "No table references found, passing query as-is" });
            return query;
        }

        // Only hit Postgres once we know the query actually references tables.
        const rows = await getLiveDatasourcesByNames(tableNames);
        if (_.isEmpty(rows)) {
            logger.warn({ apiId, resmsgid, tableNames, message: "No matching datasource/datasource_ref exists, passing query as-is" });
            return query;
        }

        const refSet = new Set(_.map(rows, "datasource_ref"));
        const aliasToRef: Record<string, string> = {};
        rows.forEach((r) => { if (r.datasource) aliasToRef[r.datasource] = r.datasource_ref; });

        let changed = false;
        _.forEach(fromList, (entry: any) => {
            const name = entry.table;
            if (refSet.has(name)) {                    // already a datasource_ref -> keep
                logger.info({ apiId, resmsgid, table: name, message: `Table '${name}' already a datasource_ref, keeping as-is` });
                return;
            }
            const ref = aliasToRef[name];
            if (!ref) {                                // unknown -> keep
                logger.warn({ apiId, resmsgid, table: name, message: `Table '${name}' is neither a datasource alias nor a datasource_ref, keeping as-is` });
                return;
            }
            entry.table = ref;                         // alias -> replace with datasource_ref
            if (!entry.as || _.isEmpty(entry.as)) entry.as = name; // preserve name for column refs
            changed = true;
            logger.info({ apiId, resmsgid, alias: name, datasource_ref: ref, message: `Resolved alias '${name}' to datasource_ref '${ref}'` });
        });

        if (!changed) {                                // the only scenario we rewrite is alias->ref
            logger.info({ apiId, resmsgid, message: "No alias to resolve, passing query as-is" });
            return query;
        }

        return parser.sqlify(ast, { database: "postgresql" }).replace(/`/g, "\"");
    } catch (error: any) {
        // Never let resolution break querying — fall back to the original query.
        logger.warn({ apiId, resmsgid, message: "Datasource resolution skipped, passing query as-is", error: error?.message });
        return query;
    }
};

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
            let requestPayload = req.body;
            if (config.query_api.sql_query_alias_check) {
                const resolvedQuery = await resolveDatasourceQuery(query, resmsgid);
                requestPayload = resolvedQuery === query ? req.body : { ...req.body, query: resolvedQuery };
            } else {
                logger.info({ apiId, resmsgid, message: "sql_query_alias_check disabled, passing query as-is" });
            }
            result = await druidHttpService.post(`${config.query_api.druid.sql_query_path}`, requestPayload, {
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
