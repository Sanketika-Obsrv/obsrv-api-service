import { Request, Response } from "express";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import { DatasetStatus } from "../../types/DatasetModels";
import { datasetService, getLiveDatasetConfigs } from "../../services/DatasetService";
import _ from "lodash";
import { obsrvError } from "../../types/ObsrvError";

const validateDataset = async (req: Request) => {

    const { dataset_id } = req.params;
    const { status = DatasetStatus.Live } = req.query;

    let datasetRecord = status == DatasetStatus.Live ? await getLiveDatasetConfigs(dataset_id) : await datasetService.getDraftDataset(dataset_id)
    if (_.isEmpty(datasetRecord)) {
        throw obsrvError(dataset_id, "DATASET_NOT_FOUND", `Dataset with the given dataset_id:${dataset_id} not found to export`, "NOT_FOUND", 404);
    }

    const datasetStatus = _.get(datasetRecord, "status")
    if (_.includes([DatasetStatus.Draft, DatasetStatus.Retired, DatasetStatus.Archived], datasetStatus)) {
        throw obsrvError(dataset_id, "DATASET_EXPORT_FAILURE", `Dataset with status:${datasetStatus} cannot be exported`, "BAD_REQUEST", 400);
    }

    if (_.get(datasetRecord, "api_version") != "v2") {
        const migratedConfigs = await datasetService.migrateDatasetV1(dataset_id, datasetRecord)
        datasetRecord = { ...datasetRecord, ...migratedConfigs }
    }
        
    datasetRecord = _.omit(datasetRecord, "alias")
    return datasetRecord;
}

const datasetExport = async (req: Request, res: Response) => {

    const datasetRecord = await validateDataset(req)
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: datasetRecord });

}

export default datasetExport;