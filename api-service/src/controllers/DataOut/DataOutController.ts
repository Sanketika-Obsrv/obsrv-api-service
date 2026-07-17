import { Request, Response } from "express";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./DataOutValidationSchema.json";
import { validateQuery, setQueryLimits, buildSqlQuery } from "./QueryValidator";
import * as _ from "lodash";
import { executeNativeQuery, executeSqlQuery } from "../../connections/druidConnection";
import { datasetService } from "../../services/DatasetService";
import { obsrvError } from "../../types/ObsrvError";

export const apiId = "api.data.out";
export const query_data = { "data": {} };

const dataOutSql = async (req: Request, res: Response, msgid: string, requestBody: any) => {
    await buildSqlQuery(req, _.get(req, "body.query"));
    setQueryLimits(req.body);
    const cappedQuery = _.get(req, "body.query");
    const result = await executeSqlQuery({ query: cappedQuery });
    _.set(query_data, "data", result.data);
    logger.info({ apiId, msgid, message: "SQL query executed successfully" });
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
