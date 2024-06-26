import { Request, Response } from "express";
import _ from "lodash";
import { schemaValidation } from "../../services/ValidationService";
import DatasetResetRequestSchema from "./DatasetResetValidationSchema.json"
import { ErrorObject } from "../../types/ResponseModel";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { DatasetStatus, DatasetType, HealthStatus } from "../../types/DatasetModels";
import { Dataset } from "../../models/Dataset";
import logger from "../../logger";
import {  getDruidIndexers, getFlinkHealthStatus, restartDruidIndexers } from "../../services/HealthService";
import { Datasource } from "../../models/Datasource";
import { restartPipeline } from "../DatasetStatusTransition/DatasetStatusTransition";

export const apiId = "api.dataset.reset";
export const errorCode = "DATASET_RESET_FAILURE"



const datasetReset = async (req: Request, res: Response) => {
    const resmsgid = _.get(res, "resmsgid");
    const category = req.body?.request?.category;
    
    const datasetId = _.get(req, "params.datasetId")
    const msgid = _.get(req, ["body", "params", "msgid"]);
    try {
        const isRequestValid: Record<string, any> = schemaValidation(req.body, DatasetResetRequestSchema)
        if (!isRequestValid.isValid) {
            const code = "DATASET_RESET_INPUT_INVALID"
            logger.error({ code, apiId, msgid, category, resmsgid, message: isRequestValid.message })
            return ResponseHandler.errorResponse({
                code,
                message: isRequestValid.message,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const dataset = await getLiveDatasets(datasetId)
        if(_.isEmpty(dataset)) {
            const code = "DATASET_RESET_NO_DATASET"
            const message = `There are no live dataset exists with given dataset_id: ${datasetId}`
            logger.error({ code, apiId, msgid, category, resmsgid, message: message })
            return ResponseHandler.errorResponse({
                code,
                message,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }
        logger.debug(apiId, msgid, resmsgid, "dataset", dataset, category)
        const isMasterDataset = _.get(dataset, "[0].type") == DatasetType.MasterDataset;
        if(category == "processing") {
            const pipeLineStatus = await getFlinkHealthStatus()
            logger.debug({pipeLineStatus})
            if(pipeLineStatus == HealthStatus.UnHealthy){
                logger.debug("Restarting the pipeline")
                await restartPipeline({"dataset": {"dataset_id": datasetId}})
            }
        } else if(category == "query" && !isMasterDataset){
            const datasources = await getDataSources(datasetId)
            const unHealthySupervisors = await getDruidIndexers(datasources, HealthStatus.UnHealthy)
            const unHealthyDataSources = _.filter(unHealthySupervisors, (supervisor: any) => supervisor?.state == "SUSPENDED")
            if(!_.isEmpty(unHealthyDataSources)){
                await restartDruidIndexers(unHealthyDataSources)
            } 
        }

        return ResponseHandler.successResponse(req, res, {
            status: 200, data: {
                "status": "Completed"
            }
        });

    } catch (error: any) {
        logger.error({ error, apiId, code: errorCode, msgid, category, resmsgid });
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code: errorCode, message: "Failed to reset the dataset" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }



}
const getLiveDatasets = async (ids: string): Promise<Record<string, any>> => {
    return Dataset.findAll({ attributes: ["dataset_id", "status", "type"], where: { dataset_id: ids, status: DatasetStatus.Live }, raw: true });
}

const getDataSources = async (ids: string): Promise<Record<string, any>> => {
    return Datasource.findAll({ attributes: ["dataset_id", "datasource"], where: { dataset_id: ids }, raw: true });
}

export default datasetReset;