import { Request, Response } from "express";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./DataOutValidationSchema.json";
import { validateQuery } from "./QueryValidator";
import * as _ from "lodash";
import { executeNativeQuery, executeSqlQuery } from "../../connections/druidConnection";
import { datasetService } from "../../services/DatasetService";
import { obsrvError } from "../../types/ObsrvError";

export const apiId = "api.data.out";
export const query_data = {"data": {}};

const requestValidation = async (req: Request) => {
    const datasourceKey = req.params?.dataset_id;
    const isValidSchema = schemaValidation(req.body, validationSchema);
    if (!isValidSchema?.isValid) {
        throw obsrvError(datasourceKey, "DATA_OUT_INVALID_INPUT", isValidSchema?.message, "BAD_REQUEST", 400)
    }
    const datasource = await datasetService.getDatasourceWithKey(datasourceKey, ["datasource_ref", "dataset_id"], true)
    if (_.isEmpty(datasource)) {
        throw obsrvError(datasourceKey, "DATASET_NOT_FOUND", `Dataset with id/alias name '${datasourceKey}' not found`, "NOT_FOUND", 404)
    }
    return datasource
}

const dataOut = async (req: Request, res: Response) => {
    const requestBody = req.body;
    const msgid = _.get(req, "body.params.msgid");
    const dataset = await requestValidation(req)
    const { dataset_id: datasetId, datasource_ref } = dataset
    const isValidQuery: any = await validateQuery(req.body, datasetId, datasource_ref);
    const query = _.get(req, "body.query", "")

    if (isValidQuery === true && _.isObject(query)) {
        const result = await executeNativeQuery(query);
        _.set(query_data, "data", result.data);
        logger.info({ apiId, msgid, requestBody, datasetId, message: "Native query executed successfully" })
        return ResponseHandler.successResponse(req, res, {
            status: 200, data: result?.data
        });
    }

    if (isValidQuery === true && _.isString(query)) {
        const result = await executeSqlQuery({ query })
        _.set(query_data, "data", result.data);
        logger.info({ apiId, msgid, requestBody, datasetId, message: "SQL query executed successfully" })
        return ResponseHandler.successResponse(req, res, {
            status: 200, data: result?.data
        });
    }

    else {
        logger.error({ apiId, msgid, requestBody, datasetId, message: isValidQuery?.message, code: isValidQuery?.code })
        return ResponseHandler.errorResponse({ message: isValidQuery?.message, statusCode: isValidQuery?.statusCode, errCode: isValidQuery?.errCode, code: isValidQuery?.code }, req, res);
    }
}

export default dataOut;