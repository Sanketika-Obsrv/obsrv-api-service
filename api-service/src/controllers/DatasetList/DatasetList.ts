import _ from "lodash";
import httpStatus from "http-status";
import { Request, Response } from "express";
import logger from "../../logger";
import { schemaValidation } from "../../services/ValidationService";
import DatasetCreate from "./DatasetListValidationSchema.json";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { datasetService } from "../../services/DatasetService";
import { obsrvError } from "../../types/ObsrvError";

export const apiId = "api.datasets.list"
export const errorCode = "DATASET_LIST_FAILURE"
const liveDatasetStatus = ["Live", "Retired", "Purged"]
const draftDatasetStatus = ["Draft", "ReadyToPublish"]
const defaultFields = ["dataset_id", "name", "type", "status", "tags", "version", "api_version", "dataset_config", "created_date", "updated_date","data_schema"]

const datasetList = async (req: Request, res: Response) => {
    
    const isRequestValid: Record<string, any> = schemaValidation(req.body, DatasetCreate)
    if (!isRequestValid.isValid) {
        throw obsrvError("", "DATASET_LIST_INPUT_INVALID", isRequestValid.message, "BAD_REQUEST", 400)
    }

    const datasetBody = req.body.request;
    const datasetList = await listDatasets(datasetBody)
    const responseData = { data: datasetList, count: _.size(datasetList) }
    logger.info({req: req.body, resmsgid: _.get(res, "resmsgid"), message: `Datasets are listed successfully with a dataset count (${_.size(datasetList)})` })
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: responseData });
    
}

const listDatasets = async (request: Record<string, any>): Promise<Record<string, any>> => {

    const { filters = {} } = request || {};
    const datasetStatus = _.get(filters, "status");
    const status = _.isArray(datasetStatus) ? datasetStatus : _.compact([datasetStatus])
    const draftFilters = _.set(_.cloneDeep(filters), "status", _.isEmpty(status) ? draftDatasetStatus : _.intersection(status, draftDatasetStatus));
    const liveFilters = _.set(_.cloneDeep(filters), "status", _.isEmpty(status) ? liveDatasetStatus : _.intersection(status, liveDatasetStatus));
    const liveDatasetList = await datasetService.findDatasets(liveFilters, defaultFields, [["updated_date", "DESC"]]);
    const draftDatasetList = await datasetService.findDraftDatasets(draftFilters, defaultFields, [["updated_date", "DESC"]]);
    return _.compact(_.concat(liveDatasetList, draftDatasetList));
}

export default datasetList;