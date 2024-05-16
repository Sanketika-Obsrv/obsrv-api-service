import { Request, Response } from "express";
import { schemaValidation } from "../../services/ValidationService";
import DatasetCreate from "./DatasetListValidationSchema.json";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { ErrorObject } from "../../types/ResponseModel";
import { DatasetDraft } from "../../models/DatasetDraft";
import logger from "../../logger";
import _ from "lodash";
import { Dataset } from "../../models/Dataset";
import httpStatus from "http-status";
import { DatasetTransformationsDraft } from "../../models/TransformationDraft";
import { DatasetTransformations } from "../../models/Transformation";
import { DatasetStatus } from "../../types/DatasetModels";

export const apiId = "api.datasets.list"
export const errorCode = "DATASET_LIST_FAILURE"
const liveDatasetStatus = ["Live", "Retired"]
const draftDatasetStatus = ["Draft", "Publish"]

const datasetList = async (req: Request, res: Response) => {
    const requestBody = req.body;
    const msgid = _.get(req, ["body", "params", "msgid"]);
    const resmsgid = _.get(res, "resmsgid");
    try {
        const isRequestValid: Record<string, any> = schemaValidation(req.body, DatasetCreate)
        if (!isRequestValid.isValid) {
            const code = "DATASET_LIST_INPUT_INVALID"
            logger.error({ code, apiId, msgid, requestBody, resmsgid, message: isRequestValid.message })
            return ResponseHandler.errorResponse({
                code,
                message: isRequestValid.message,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const datasetBody = req.body.request;
        const datasetList = await getDatasetList(datasetBody)
        const responseData = { data: datasetList, count: _.size(datasetList) }
        logger.info({ apiId, msgid, requestBody, resmsgid, message: `Datasets are listed successfully with a dataset count (${_.size(datasetList)})` })
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: responseData });
    } catch (error: any) {
        logger.error({ ...error, apiId, code: errorCode, msgid, requestBody, resmsgid });
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code: errorCode, message: "Failed to list dataset" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const getDatasetList = async (request: Record<string, any>): Promise<Record<string, any>> => {
    const { filters = {}, sortBy = [] } = request || {};
    const datasets = await getAllDatasets(filters)
    const sortedDatasets: any = getSortedDatasets(datasets, sortBy)
    const datasetsList = await transformDatasetList(sortedDatasets)
    return datasetsList;
}

const getAllDatasets = async (filters: Record<string, any>): Promise<Record<string, any>> => {
    const datasetStatus = _.get(filters, "status");
    const { liveDatasetList, draftDatasetList } = await fetchDatasets({ datasetStatus, filters })
    return _.compact(_.concat(liveDatasetList, draftDatasetList))
}

const fetchDatasets = async (data: Record<string, any>) => {
    const { filters, datasetStatus } = data
    if (_.isEmpty(datasetStatus)) {
        const [liveDatasetList, draftDatasetList] = await Promise.all([getLiveDatasets(filters, liveDatasetStatus), getDraftDatasets(filters, draftDatasetStatus)])
        return { liveDatasetList, draftDatasetList }
    }
    let liveDatasetList, draftDatasetList;
    const status = _.isArray(datasetStatus) ? datasetStatus : [datasetStatus]
    const draftStatus = _.intersection(status, draftDatasetStatus);
    const liveStatus = _.intersection(status, liveDatasetStatus);
    if (_.size(liveStatus) > 0) {
        liveDatasetList = await getLiveDatasets(filters, liveStatus)
    }
    if (_.size(draftStatus) > 0) {
        draftDatasetList = await getDraftDatasets(filters, draftStatus)
    }
    return { liveDatasetList, draftDatasetList }
}

const getSortedDatasets = (datasets: Record<string, any>, sortOrder: Record<string, any>): Record<string, any> => {
    if (!_.isEmpty(sortOrder)) {
        const fieldValues = _.map(sortOrder, field => _.get(field, "field"))
        const orderValues = _.map(sortOrder, field => _.get(field, "order"))
        return _.orderBy(datasets, fieldValues, orderValues)
    }
    return datasets
}

const transformDatasetList = async (datasets: Record<string, any>) => {
    const { liveDatasetId, draftDatasetId } = getDatasetId(datasets)
    const [draftTransformations, liveTransformations] = await Promise.all([getDraftTransformations(draftDatasetId), getLiveTransformations(liveDatasetId)])
    const transformationList = _.concat(liveTransformations, draftTransformations)
    const datasetList = _.map(datasets, dataset => {
        const transformationConfig = _.compact(_.flatten(_.map(transformationList, (transformations: any) => {
            const datasetId = _.get(dataset, "id")
            const transformationId = _.get(transformations, "dataset_id")
            if (datasetId === transformationId) {
                return _.omit(transformations, ["dataset_id"]);
            }
        })))
        const liveDatasetVersion = _.get(dataset, "data_version")
        const updatedList = liveDatasetVersion ? { ..._.omit(dataset, ["data_version"]), version: liveDatasetVersion } : dataset
        return { ...updatedList, ...(!_.isEmpty(transformationConfig) && { "transformations_config": transformationConfig }) }
    })
    return datasetList
}

const getDatasetId = (datasets: Record<string, any>) => {
    const liveDatasets = _.filter(datasets, field => {
        const { status } = field || {}
        return status === DatasetStatus.Live || status === DatasetStatus.Retired
    })
    const draftDatasets = _.filter(datasets, field => {
        const { status } = field || {}
        return status === DatasetStatus.Draft || status === DatasetStatus.Publish
    })
    const liveDatasetId = _.map(liveDatasets, list => _.get(list, "id"))
    const draftDatasetId = _.map(draftDatasets, list => _.get(list, "id"))
    return { liveDatasetId, draftDatasetId }
}

const getDraftDatasets = async (filters: Record<string, any>, datasetStatus: Array<any>): Promise<Record<string, any>> => {
    return DatasetDraft.findAll({ where: { ...filters, ...(!_.isEmpty(datasetStatus) && { status: datasetStatus }) }, raw: true });
}

const getLiveDatasets = async (filters: Record<string, any>, datasetStatus: Array<any>): Promise<Record<string, any>> => {
    return Dataset.findAll({ where: { ...filters, ...(!_.isEmpty(datasetStatus) && { status: datasetStatus }) }, raw: true });
}

const datasetTransformationAttributes = ["dataset_id", "field_key", "transformation_function", "mode", "metadata"]

const getDraftTransformations = async (dataset_id: Array<any>) => {
    return DatasetTransformationsDraft.findAll({ where: { status: draftDatasetStatus, dataset_id }, attributes: datasetTransformationAttributes, raw: true })
}

const getLiveTransformations = async (dataset_id: Array<any>) => {
    return DatasetTransformations.findAll({ where: { status: liveDatasetStatus, dataset_id }, attributes: datasetTransformationAttributes, raw: true })
}

export default datasetList;