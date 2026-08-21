import { Request, Response } from "express";
import * as _ from "lodash";
import { obsrvError } from "../../types/ObsrvError";
import { schemaValidation } from "../../services/ValidationService";
import DatasourceSchema from "./RequestValidationSchema.json";
import httpStatus from "http-status";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import logger from "../../logger";
import { datasetService } from "../../services/DatasetService";
import { Datasource } from "../../models/Datasource";
import { TableDraft } from "../../models/Table";

export const apiId = "api.datasources.list"
export const errorCode = "DATASOURCES_LIST_FAILURE"
const liveDatasourceStatus = ["Live", "Retired"]
const draftDatasourceStatus = ["Draft"]
// Mirrors the filters.status enum in RequestValidationSchema.json
const allowedStatus = ["Draft", "Live", "Retired", "Purged"]
const defaultLiveFields = ["dataset_id", "datasource", "type", "status", "id", "created_by", "updated_by", "created_date", "updated_date"]
const defaultDraftFields = ["id", "dataset_id", "type", "status", "created_by", "updated_by", "created_date", "updated_date"]
const liveModelFields = _.keys(Datasource.getAttributes())
// Draft datasources are read from the table_draft table, so restrict draft fields to that model
const draftModelFields = _.keys(TableDraft.getAttributes())

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
    const allowedFields = _.union(liveModelFields, draftModelFields, defaultLiveFields, defaultDraftFields)
    if (_.isArray(fields) && fields.length > allowedFields.length) {
        throw obsrvError("", "DATASOURCE_LIST_INPUT_INVALID", "Fields array length exceeds the allowed limit", "BAD_REQUEST", 400)
    }
    const requestedFields = _.uniq(_.isArray(fields) ? fields : _.compact([fields]))
    const invalidFields = _.difference(requestedFields, allowedFields)
    if (!_.isEmpty(invalidFields)) {
        throw obsrvError("", "DATASOURCE_LIST_INPUT_INVALID", `The specified fields [${invalidFields}] in the datasource cannot be found`, "BAD_REQUEST", 400)
    }
    const liveFields = _.union(defaultLiveFields, _.intersection(requestedFields, liveModelFields))
    const draftFields = _.union(defaultDraftFields, _.intersection(requestedFields, draftModelFields))
    const dsStatus = _.get(filters, "status");
    // Bound the caller-supplied status list before the intersections below iterate it
    if (_.isArray(dsStatus) && dsStatus.length > allowedStatus.length) {
        throw obsrvError("", "DATASOURCE_LIST_INPUT_INVALID", "Status array length exceeds the allowed limit", "BAD_REQUEST", 400)
    }
    // slice gives the intersections below a length bound that does not derive from user input
    const status = _.isArray(dsStatus) ? dsStatus.slice(0, allowedStatus.length) : _.compact([dsStatus])
    const draftStatus = _.isEmpty(status) ? draftDatasourceStatus : _.intersection(status, draftDatasourceStatus)
    const liveStatus = _.isEmpty(status) ? liveDatasourceStatus : _.intersection(status, liveDatasourceStatus)
    const draftFilters = _.set(_.cloneDeep(filters), "status", draftStatus);
    const liveFilters = _.set(_.cloneDeep(filters), "status", liveStatus);
    // Skip a query entirely when the requested status cannot match it, avoiding a needless db call
    const liveDatasourceList = _.isEmpty(liveStatus) ? [] : await datasetService.findDatasources(liveFilters, liveFields);
    const draftDatasourceList = _.isEmpty(draftStatus) ? [] : await datasetService.findDraftDatasources(draftFilters, draftFields);
    return _.compact(_.concat(liveDatasourceList, draftDatasourceList));

}

export default getDatasourceList;