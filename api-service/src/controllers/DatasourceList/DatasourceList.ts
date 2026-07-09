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
const defaultLiveFields = ["dataset_id", "datasource", "type", "status", "id", "created_by", "updated_by", "created_date", "updated_date"]
const defaultDraftFields = ["id", "dataset_id", "name", "type", "status", "created_by", "updated_by", "created_date", "updated_date"]
const allowedLiveFields = [...defaultLiveFields, "ingestion_spec", "datasource_ref", "retention_period", "archival_policy", "purge_policy", "backup_config", "published_date", "metadata"]
const allowedDraftFields = [...defaultDraftFields, "ingestion_spec", "datasource_ref", "retention_period", "archival_policy", "purge_policy", "backup_config", "metadata"]

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

    const { filters = {}, fields = [] } = request || {};
    const requestedFields = _.isArray(fields) ? fields : _.compact([fields])
    const invalidFields = _.difference(requestedFields, _.union(allowedLiveFields, allowedDraftFields))
    if (!_.isEmpty(invalidFields)) {
        throw obsrvError("", "DATASOURCE_LIST_INPUT_INVALID", `The specified fields [${invalidFields}] in the datasource cannot be found`, "BAD_REQUEST", 400)
    }
    const liveFields = _.union(defaultLiveFields, _.intersection(requestedFields, allowedLiveFields))
    const draftFields = _.union(defaultDraftFields, _.intersection(requestedFields, allowedDraftFields))
    const dsStatus = _.get(filters, "status");
    const status = _.isArray(dsStatus) ? dsStatus : _.compact([dsStatus])
    const draftFilters = _.set(_.cloneDeep(filters), "status", _.isEmpty(status) ? draftDatasourceStatus : _.intersection(status, draftDatasourceStatus));
    const liveFilters = _.set(_.cloneDeep(filters), "status", _.isEmpty(status) ? liveDatasourceStatus : _.intersection(status, liveDatasourceStatus));
    const liveDatasourceList = await datasetService.findDatasources(liveFilters, liveFields);
    const draftDatasourceList = await datasetService.findDraftDatasources(draftFilters, draftFields);
    return _.compact(_.concat(liveDatasourceList, draftDatasourceList));

}

export default getDatasourceList;