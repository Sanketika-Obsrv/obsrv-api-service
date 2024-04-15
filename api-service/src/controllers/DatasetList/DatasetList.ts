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
const liveTableStatus = ["Live", "Retired"]
const draftTableStatus = ["Draft", "Publish"]

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
        logger.info("Datasets are listed successfully")
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: datasetList });
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
    let allDatasets: any = await getAllDatasets(filters)
    if (offset || limit) {
        allDatasets = _.slice(allDatasets, offset, offset + limit)
    }
    const sortedDatasets = getSortedDatasets(allDatasets, sortBy)
    const datasetsList = await transformDatasetList(sortedDatasets)
    return datasetsList;
}

const getSortedDatasets = (datasets: Record<string, any>, sortOrder: Record<string, any>): Record<string, any> => {
    if (!_.isEmpty(sortOrder)) {
        const columnValues = _.map(sortOrder, field => field.column)
        const orderValues = _.map(sortOrder, field => field.order)
        return _.orderBy(datasets, columnValues, orderValues)
    }
    return datasets
}

const getAllDatasets = async (filters: Record<string, any>): Promise<Record<string, any>> => {
    let datasetStatus = _.get(filters, "status");
    datasetStatus = _.isArray(datasetStatus) ? datasetStatus : [datasetStatus]
    let liveDatasetList, draftDatasetList;
    if (_.isEmpty(datasetStatus)) {
        liveDatasetList = await Dataset.findAll({ ...(!_.isEmpty(filters) && { where: filters }), raw: true });
        draftDatasetList = await DatasetDraft.findAll({ ...(!_.isEmpty(filters) && { where: filters }), raw: true });
    } else {
        const hasDraftStatus = _.size(_.intersection(datasetStatus, draftTableStatus)) > 0;
        const hasLiveStatus = _.size(_.intersection(datasetStatus, liveTableStatus)) > 0;

        if (hasDraftStatus && !hasLiveStatus) {
            draftDatasetList = await DatasetDraft.findAll({ where: { ...filters, status: datasetStatus }, raw: true });
        } else if (hasLiveStatus && !hasDraftStatus) {
            liveDatasetList = await Dataset.findAll({ where: { ...filters, status: datasetStatus }, raw: true });
        } else {
            const liveStatusFilters = _.intersection(datasetStatus, ["Live", "Retired"]);
            const draftStatusFilters = _.intersection(datasetStatus, ["Publish", "Draft"]);

            if (_.size(liveStatusFilters) > 0) {
                liveDatasetList = await Dataset.findAll({ where: { ...filters, status: liveStatusFilters }, raw: true });
            }

            if (_.size(draftStatusFilters) > 0) {
                draftDatasetList = await DatasetDraft.findAll({ where: { ...filters, status: draftStatusFilters }, raw: true });
            }
        }
    }
    return _.concat(liveDatasetList, draftDatasetList)
}

const datasetTransformationAttributes = ["dataset_id", "field_key", "transformation_function", "mode", "metadata"]

const transformDatasetList = async (datasets: Record<string, any>) => {
    const liveTransformations = await DatasetTransformations.findAll({ where: { status: liveTableStatus }, attributes: datasetTransformationAttributes, raw: true })
    const draftTransformations = await DatasetTransformationsDraft.findAll({ where: { status: draftTableStatus }, attributes: datasetTransformationAttributes, raw: true })
    const allTransformations = _.concat(liveTransformations, draftTransformations)
    const datasetLists = _.map(datasets, list => {
        const config = _.compact(_.flatten(_.map(allTransformations, (fields: any) => {
            if (list.id == fields.dataset_id) {
                return fields;
            }
        })))
        const liveDatasetVersion = _.get(list, "data_version")
        const updatedList = liveDatasetVersion ? { ..._.omit(list, ["data_version"]), version: liveDatasetVersion } : list
        return { ...updatedList, ...(!_.isEmpty(config) && { "transformations_config": config }) }
    })
    return datasetLists
}

export default datasetList;