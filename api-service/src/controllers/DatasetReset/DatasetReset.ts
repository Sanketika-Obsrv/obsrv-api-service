import { Request, Response } from "express";
import _ from "lodash";
import { schemaValidation } from "../../services/ValidationService";
import DatasetResetRequestSchema from "./DatasetResetValidationSchema.json"
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { HealthStatus } from "../../types/DatasetModels";
import { getDruidIndexers, getFlinkHealthStatus, restartDruidIndexers } from "../../services/DatasetHealthService";
import { restartPipeline } from "../DatasetStatusTransition/DatasetStatusTransition";
import { obsrvError } from "../../types/ObsrvError";
import { datasetService } from "../../services/DatasetService";
import httpStatus from "http-status";

export const apiId = "api.dataset.reset";

const validateRequest = async (req: Request) => {

    const isRequestValid: Record<string, any> = schemaValidation(req.body, DatasetResetRequestSchema)
    if (!isRequestValid.isValid) {
        throw obsrvError("", "DATASET_INVALID_INPUT", isRequestValid.message, "BAD_REQUEST", 400)
    }
    const datasetId = _.get(req, ["params", "datasetId"])
    const isDataSetExists = await datasetService.checkDatasetExists(datasetId);
    if (!isDataSetExists) {
        throw obsrvError(datasetId, "DATASET_NOT_FOUND", `Dataset not exists with id:${datasetId}`, httpStatus[httpStatus.NOT_FOUND], 404)
    }
}

const datasetReset = async (req: Request, res: Response) => {

    const category = _.get(req, ["body", "request", "category"]);
    const datasetId = _.get(req, ["params"," datasetId"]);

    await validateRequest(req);
    if (category == "processing") {
        const pipeLineStatus = await getFlinkHealthStatus()
        if (pipeLineStatus == HealthStatus.UnHealthy) {
            await restartPipeline({ "dataset": { "dataset_id": datasetId } })
        }
    } else if (category == "query") {
        const datasources = await datasetService.findDatasources({"dataset_id": datasetId})
        if(!_.isEmpty(datasources)) {
            const unHealthySupervisors = await getDruidIndexers(datasources, HealthStatus.UnHealthy)
            const unHealthyDataSources = _.filter(unHealthySupervisors, (supervisor: any) => supervisor?.state == "SUSPENDED")
            if (!_.isEmpty(unHealthyDataSources)) {
                await restartDruidIndexers(unHealthyDataSources)
            }
        }   
    }

    return ResponseHandler.successResponse(req, res, {
        status: 200, data: {
            "status": "Completed"
        }
    });
}

export default datasetReset;