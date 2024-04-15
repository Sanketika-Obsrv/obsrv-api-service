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

export const apiId = "api.datasets.list"
const liveDatasetStatus = ["Live", "Retired"]
const draftDatasetStatus = ["Draft", "Publish"]

const datasetList = async (req: Request, res: Response) => {
    try {
        const isRequestValid: Record<string, any> = schemaValidation(req.body, DatasetCreate)
        if (!isRequestValid.isValid) {
            return ResponseHandler.errorResponse({
                message: isRequestValid.message,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const requestBody = req.body.request;
        const datasetList = await getDatasetList(requestBody)
        logger.info(`Datasets are listed successfully with a dataset count (${_.size(datasetList)})`)
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { data: datasetList, count: _.size(datasetList) } });
    } catch (error: any) {
        logger.error(error);
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { message: "Failed to list dataset" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const getDatasetList = async (request: Record<string, any>): Promise<Record<string, any>> => {
    const { filters = {}, offset = 0, limit = 50, sortBy = [] } = request || {};
    const datasets = await getAllDatasets(filters)
    let sortedDatasets: any = getSortedDatasets(datasets, sortBy)
    sortedDatasets = _.slice(sortedDatasets, offset, offset + limit)
    const datasetsList = await transformDatasetList(sortedDatasets)
    return datasetsList;
}

const getAllDatasets = async (filters: Record<string, any>): Promise<Record<string, any>> => {
    let datasetStatus = _.get(filters, "status");
    datasetStatus = _.isArray(datasetStatus) ? datasetStatus : _.compact([datasetStatus])
    const { liveDatasetList, draftDatasetList } = await fetchDatasets({ datasetStatus, filters })
    return _.compact(_.concat(liveDatasetList, draftDatasetList))
}

const fetchDatasets = async (data: Record<string, any>) => {
    const { filters, datasetStatus } = data
    let liveDatasetList, draftDatasetList;
    if (_.isEmpty(datasetStatus)) {
        liveDatasetList = await getLiveDatasets(filters, liveDatasetStatus)
        draftDatasetList = await getDraftDatasets(filters, draftDatasetStatus)
        return { liveDatasetList, draftDatasetList }
    }
    const draftStatus = _.intersection(datasetStatus, draftDatasetStatus);
    const liveStatus = _.intersection(datasetStatus, liveDatasetStatus);
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
        const columnValues = _.map(sortOrder, field => field.column)
        const orderValues = _.map(sortOrder, field => field.order)
        return _.orderBy(datasets, columnValues, orderValues)
    }
    return datasets
}

const transformDatasetList = async (datasets: Record<string, any>) => {
    const liveTransformations = await getDraftTransformations();
    const draftTransformations = await getLiveTransformations();
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

const getDraftDatasets = async (filters: Record<string, any>, datasetStatus: Array<any>): Promise<Record<string, any>> => {
    return DatasetDraft.findAll({ where: { ...filters, ...(!_.isEmpty(datasetStatus) && { status: datasetStatus }) }, raw: true });
}

const getLiveDatasets = async (filters: Record<string, any>, datasetStatus: Array<any>): Promise<Record<string, any>> => {
    return Dataset.findAll({ where: { ...filters, ...(!_.isEmpty(datasetStatus) && { status: datasetStatus }) }, raw: true });
}

const datasetTransformationAttributes = ["dataset_id", "field_key", "transformation_function", "mode", "metadata"]

const getDraftTransformations = async () => {
    return DatasetTransformationsDraft.findAll({ where: { status: draftDatasetStatus }, attributes: datasetTransformationAttributes, raw: true })
}

const getLiveTransformations = async () => {
    return DatasetTransformations.findAll({ where: { status: liveDatasetStatus }, attributes: datasetTransformationAttributes, raw: true })
}

export default datasetList;