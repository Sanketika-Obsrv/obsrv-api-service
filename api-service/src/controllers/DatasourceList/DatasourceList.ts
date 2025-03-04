import { Request, Response } from "express";
import * as _ from "lodash";
import { obsrvError } from "../../types/ObsrvError";
import { schemaValidation } from "../../services/ValidationService";
import DatasourceSchema from "./RequestValidationSchema.json";
import httpStatus from "http-status";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import logger from "../../logger";
import { datasetService } from "../../services/DatasetService";

export const apiId = "api.datasources.list"
export const errorCode = "DATASOURCES_LIST_FAILURE"
const liveDatasourceStatus = ["Live", "Retired"]
const draftDatasourceStatus = ["Draft"]

const getDatasourceList = async (req: Request, res: Response) => {

    const isRequestValid: Record<string, any> = schemaValidation(req.body, DatasourceSchema)
    if (!isRequestValid.isValid) {
        throw obsrvError("", "DATASOURCE_LIST_INPUT_INVALID", isRequestValid.message, "BAD_REQUEST", 400)
    }
    const datasourceBody = req.body.request;
    const datasourceList = await listDatasources(datasourceBody)
    const responseData = { data: datasourceList, count: _.size(datasourceList) }
    logger.info({ req: req.body, resmsgid: _.get(res, "resmsgid"), message: `Datasources are listed successfully with a datasource count (${_.size(datasourceList)})` })
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: responseData });

};

const listDatasources = async (request: Record<string, any>): Promise<Record<string, any>> => {

    const { filters = {} } = request || {};
    const dsStatus = _.get(filters, "status");
    const status = _.isArray(dsStatus) ? dsStatus : _.compact([dsStatus])
    const draftFilters = _.set(_.cloneDeep(filters), "status", _.isEmpty(status) ? draftDatasourceStatus : _.intersection(status, draftDatasourceStatus));
    const liveFilters = _.set(_.cloneDeep(filters), "status", _.isEmpty(status) ? liveDatasourceStatus : _.intersection(status, liveDatasourceStatus));
    const liveDatasourceList = await datasetService.findDatasources(liveFilters, ["dataset_id", "datasource", "type", "status", "id", "type", "created_by", "updated_by", "created_date", "updated_date"]);
    const draftDatasourceList = await datasetService.findDraftDatasources(draftFilters, ["id", "dataset_id","name", "type", "status", "created_by", "updated_by", "created_date", "updated_date"]);
    return _.compact(_.concat(liveDatasourceList, draftDatasourceList));

}

export default getDatasourceList;