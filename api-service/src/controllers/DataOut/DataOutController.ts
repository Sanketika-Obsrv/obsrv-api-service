import { Request, Response } from "express";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./DataOutValidationSchema.json";
import { validateQuery, setQueryLimits, checkSupervisorAvailability } from "./QueryValidator";
import * as _ from "lodash";
import { executeNativeQuery, executeSqlQuery, getDatasourceListFromDruid, druidHttpService } from "../../connections/druidConnection";
import { datasetService } from "../../services/DatasetService";
import { obsrvError } from "../../types/ObsrvError";
import { Parser } from "node-sql-parser";

export const apiId = "api.data.out";
export const query_data = { "data": {} };

const parser = new Parser();

const buildSqlQuery = async (req: Request, query: string) => {
    const ast: any = parser.astify(query, { database: "postgresql" });
    const fromList = _.castArray(_.get(ast, "from", [])).filter(Boolean);
    const tableParams = _.get(req, "query", {}) as Record<string, any>;

    const missingParams: string[] = [];
    const tableToRef: Record<string, string> = {};
    _.forEach(fromList, (entry: any) => {
        const table = _.get(entry, "table");
        const ref = tableParams[table];
        if (!_.isString(ref) || _.isEmpty(ref)) {
            missingParams.push(table);
        } else {
            tableToRef[table] = ref;
        }
    });
    if (!_.isEmpty(missingParams)) {
        const logMsg = `Missing query param(s) for table(s): ${_.uniq(missingParams).join(", ")}`;
        const errorMsg = "Invalid request: table mapping parameter is missing.";
        logger.error({ apiId, message: logMsg });
        throw obsrvError("", "DATA_OUT_MISSING_TABLE_PARAM", errorMsg, "BAD_REQUEST", 400);
    }

    // Verify each mapped datasource_ref exists in postgres.
    const datasourceRefs = _.uniq(_.values(tableToRef));
    const existing = await datasetService.getExistingDatasourceRefs(datasourceRefs);
    const notFound = _.difference(datasourceRefs, _.map(existing, "datasource_ref"));
    if (!_.isEmpty(notFound)) {
        throw obsrvError("", "DATASOURCE_NOT_FOUND", `Datasource(s) not found: ${notFound.join(", ")}`, "NOT_FOUND", 404);
    }

    // Verify each mapped datasource_ref load status in Druid.
    const msgid = _.get(req, "body.params.msgid");
    for (const ref of datasourceRefs) {
        await checkSupervisorAvailability(ref, req.body, msgid);
    }

    // Verify each mapped datasource_ref exists in Druid.
    const druidDatasources = await getDatasourceListFromDruid();
    const notInDruid = _.difference(datasourceRefs, druidDatasources.data);
    if (!_.isEmpty(notInDruid)) {
        throw obsrvError("", "DATASOURCE_NOT_FOUND", `Datasource(s) not available for querying: ${notInDruid.join(", ")}`, "NOT_FOUND", 404);
    }

    // Replace table names with the param values and emit SQL.
    _.forEach(fromList, (entry: any) => { entry.table = tableToRef[entry.table]; });
    const rewrittenQuery = parser.sqlify(ast, { database: "postgresql" }).replace(/`/g, "\"");
    _.set(req, "body.query", rewrittenQuery);
    return rewrittenQuery;
};

const dataOutSql = async (req: Request, res: Response, msgid: string, requestBody: any) => {
    await buildSqlQuery(req, _.get(req, "body.query"));
    setQueryLimits(req.body);
    const cappedQuery = _.get(req, "body.query");
    const result = await executeSqlQuery({ query: cappedQuery });
    _.set(query_data, "data", result.data);
    logger.info({ apiId, msgid, requestBody, message: "SQL query executed successfully" });
    return ResponseHandler.successResponse(req, res, { status: 200, data: result?.data });
};


const nativeRequestValidation = async (req: Request) => {
    const datasourceKey = req.params?.dataset_id;
    const datasource = await datasetService.getDatasourceWithKey(datasourceKey, ["datasource_ref", "dataset_id"], true);
    if (_.isEmpty(datasource)) {
        throw obsrvError(datasourceKey, "DATASET_NOT_FOUND", `Dataset with id/alias name '${datasourceKey}' not found`, "NOT_FOUND", 404);
    }
    _.set(req, "body.request.dataset_id", datasource.dataset_id);
    return datasource;
};

const dataOutNative = async (req: Request, res: Response, msgid: string, requestBody: any) => {
    const dataset = await nativeRequestValidation(req);
    const { dataset_id: datasetId, datasource_ref } = dataset;
    const isValidQuery: any = await validateQuery(req.body, datasetId, datasource_ref);
    const query = _.get(req, "body.query", "");

    if (isValidQuery === true && _.isObject(query)) {
        const result = await executeNativeQuery(query);
        _.set(query_data, "data", result.data);
        logger.info({ apiId, msgid, requestBody, datasetId, message: "Native query executed successfully" });
        return ResponseHandler.successResponse(req, res, { status: 200, data: result?.data });
    }

    logger.error({ apiId, msgid, requestBody, datasetId, message: isValidQuery?.message, code: isValidQuery?.code });
    return ResponseHandler.errorResponse({ message: isValidQuery?.message, statusCode: isValidQuery?.statusCode, errCode: isValidQuery?.errCode, code: isValidQuery?.code }, req, res);
};

const dataOut = async (req: Request, res: Response) => {
    const requestBody = req.body;
    const msgid = _.get(req, "body.params.msgid");

    const isValidSchema = schemaValidation(req.body, validationSchema);
    if (!isValidSchema?.isValid) {
        throw obsrvError(req.params?.dataset_id, "DATA_OUT_INVALID_INPUT", isValidSchema?.message, "BAD_REQUEST", 400);
    }

    const query = _.get(req, "body.query");
    if (_.isString(query)) {
        return dataOutSql(req, res, msgid, requestBody);
    }
    return dataOutNative(req, res, msgid, requestBody);
};

export default dataOut;
