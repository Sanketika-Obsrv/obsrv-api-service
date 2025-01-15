import { Request, Response } from "express";
import _ from "lodash";
import { executeNativeQuery } from "../../connections/druidConnection";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import vaidationSchema from "./DataMetricsValidationSchema.json"
import { schemaValidation } from "../../services/ValidationService";
import logger from "../../logger";
import { obsrvError } from "../../types/ObsrvError";
import axios from "axios";
import { config } from "../../configs/Config";

const getBaseUrl = (url: string) => {
    if (_.startsWith(url, "/prom")) return config.query_api.prometheus.url + _.replace(url, "/prom", "")
}

const dataMetrics = async (req: Request, res: Response) => {
    const isValidSchema = schemaValidation(req.body, vaidationSchema);
    if (!isValidSchema?.isValid) {
        logger.error({ message: isValidSchema?.message, code: "INVALID_QUERY" })
        throw obsrvError("", "INVALID_QUERY", isValidSchema.message, "BAD_REQUEST", 400)
    }
    const { query } = req.body || {};
    const endpoint = query.url;
    if (_.startsWith(endpoint, "/prom")) {
        query.url = getBaseUrl(endpoint)
        const { url, method, headers = {}, body = {}, params = {}, ...rest } = query;
        const apiResponse = await axios.request({ url, method, headers, params, data: body, ...rest })
        const data = _.get(apiResponse, "data");
        return res.json(data);
    }
    else {
        const query = _.get(req, ["body", "query", "body", "query"]);
        const response = await executeNativeQuery(query);
        ResponseHandler.successResponse(req, res, { status: 200, data: _.get(response, "data") });
    }
}

export default dataMetrics;