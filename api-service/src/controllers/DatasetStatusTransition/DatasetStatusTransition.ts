import { Request, Response } from "express";
import _ from "lodash";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { getDataset, getDraftDataset, setReqDatasetId } from "../../services/DatasetService";
import { ErrorObject } from "../../types/ResponseModel";
import { schemaValidation } from "../../services/ValidationService";
import StatusTransitionSchema from "./RequestValidationSchema.json";
import ReadyToPublishSchema from "./ReadyToPublishSchema.json"
import httpStatus from "http-status";
import { sequelize } from "../../connections/databaseConnection";
import { DatasetTransformationsDraft } from "../../models/TransformationDraft";
import { DatasourceDraft } from "../../models/DatasourceDraft";
import { DatasetSourceConfigDraft } from "../../models/DatasetSourceConfigDraft";
import { DatasetDraft } from "../../models/DatasetDraft";
import { Dataset } from "../../models/Dataset";
import { DatasetAction, DatasetStatus, DatasetType } from "../../types/DatasetModels";
import { DatasetSourceConfig } from "../../models/DatasetSourceConfig";
import { Datasource } from "../../models/Datasource";
import { DatasetTransformations } from "../../models/Transformation";
import { executeCommand } from "../../connections/commandServiceConnection";
import { druidHttpService } from "../../connections/druidConnection";

export const apiId = "api.datasets.status-transition";
export const errorCode = "DATASET_STATUS_TRANSITION_FAILURE"

const allowedTransitions = {
    Delete: ["Draft", "ReadyToPublish"],
    ReadyToPublish: ["Draft"],
    Live: ["ReadyToPublish"],
    Retire: ["Live"],
}

const statusTransitionCommands = {
    Delete: ["DELETE_DRAFT_DATASETS"],
    ReadyToPublish: ["VALIDATE_DATASET_CONFIGS"],
    Live: ["PUBLISH_DATASET"],
    Retire: ["CHECK_DATASET_IS_DENORM", "SET_DATASET_TO_RETIRE", "DELETE_SUPERVISORS", "RESTART_PIPELINE"]
}

const datasetStatusTransition = async (req: Request, res: Response) => {
    const requestBody = req.body
    const msgid = _.get(req, ["body", "params", "msgid"]);
    const resmsgid = _.get(res, "resmsgid");
    try {
        const transact = await sequelize.transaction()
        try {
            const { dataset_id, status } = _.get(requestBody, "request");
            setReqDatasetId(req, dataset_id)

            const isRequestValid: Record<string, any> = schemaValidation(req.body, StatusTransitionSchema)
            if (!isRequestValid.isValid) {
                const code = "DATASET_STATUS_TRANSITION_INVALID_INPUT"
                logger.error({ code, apiId, msgid, requestBody, resmsgid, message: isRequestValid.message })
                return ResponseHandler.errorResponse({
                    code,
                    message: isRequestValid.message,
                    statusCode: 400,
                    errCode: "BAD_REQUEST"
                } as ErrorObject, req, res);
            }

            const datasetRecord = await fetchDataset({ status, dataset_id })
            if (_.isEmpty(datasetRecord)) {
                const code = "DATASET_NOT_FOUND"
                const errorMessage = getErrorMessage(status, code)
                logger.error({ code, apiId, msgid, requestBody, resmsgid, message: `${errorMessage} for dataset:${dataset_id}` })
                return ResponseHandler.errorResponse({
                    code,
                    message: errorMessage,
                    statusCode: 404,
                    errCode: "NOT_FOUND"
                } as ErrorObject, req, res);
            }

            const allowedStatus = _.get(allowedTransitions, status)
            const datasetStatus = _.get(datasetRecord, "status")
            if (!_.includes(allowedStatus, datasetStatus)) {
                const code = `DATASET_${_.toUpper(status)}_FAILURE`
                const errorMessage = getErrorMessage(status, "STATUS_INVALID")
                logger.error({ code, apiId, msgid, requestBody, resmsgid, message: `${errorMessage} for dataset:${dataset_id} status:${datasetStatus} with status transition to ${status}` })
                return ResponseHandler.errorResponse({
                    code,
                    message: errorMessage,
                    statusCode: 400,
                    errCode: "BAD_REQUEST"
                } as ErrorObject, req, res);
            }

            const transitionCommands = _.get(statusTransitionCommands, status)
            await executeTransition({ transitionCommands, dataset: datasetRecord, transact })

            await transact.commit();
            logger.info({ apiId, msgid, requestBody, resmsgid, message: `Dataset status transition to ${status} successful with id:${dataset_id}` })
            ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: `Dataset status transition to ${status} successful`, dataset_id } });
        } catch (error: any) {
            await transact.rollback();
            const code = _.get(error, "code") || errorCode
            logger.error(error, apiId, msgid, code, requestBody, resmsgid)
            let errorMessage = error;
            const statusCode = _.get(error, "statusCode")
            if (!statusCode || statusCode == 500) {
                errorMessage = { code, message: "Failed to perform status transition on datasets" }
            }
            ResponseHandler.errorResponse(errorMessage, req, res);
        }
    } catch (error: any) {
        const errMessage = error.message
        logger.error({ message: errMessage, msgid, resmsgid, apiId })
        ResponseHandler.errorResponse(errMessage, req, res);
    }
}

const fetchDataset = async (configs: Record<string, any>) => {
    const { dataset_id, status } = configs
    if (_.includes([DatasetAction.ReadyToPublish, DatasetAction.Delete], status)) {
        return getDraftDatasetRecord(dataset_id)
    }
    if (_.includes([DatasetAction.Live], status)) {
        return getDraftDataset(dataset_id)
    }
    if (_.includes([DatasetAction.Retire], status)) {
        return getDataset(dataset_id)
    }
}

const executeTransition = async (configs: Record<string, any>) => {
    const { transitionCommands, dataset, transact } = configs
    const transitionPromises = _.map(transitionCommands, async command => {
        const commandWorkflow = _.get(commandExecutors, command)
        return commandWorkflow({ dataset, transact })
    })
    await Promise.all(transitionPromises)
}

//VALIDATE_DATASET_CONFIGS
const validateDataset = async (configs: Record<string, any>) => {
    const { dataset } = configs
    const datasetValid: Record<string, any> = schemaValidation(dataset, ReadyToPublishSchema)
    if (!datasetValid.isValid) {
        throw {
            code: "DATASET_CONFIGS_INVALID",
            message: datasetValid.message,
            errCode: "BAD_REQUEST",
            statusCode: 400
        }
    }
    await DatasetDraft.update({ status: DatasetStatus.ReadyToPublish }, { where: { id: dataset.id } })
}

//DELETE_DRAFT_DATASETS
const deleteDataset = async (configs: Record<string, any>) => {
    const { dataset, transact } = configs
    const { id } = dataset
    await deleteDraftRecords({ dataset_id: id, transact })
}

const deleteDraftRecords = async (config: Record<string, any>) => {
    const { dataset_id, transact } = config;
    await DatasetTransformationsDraft.destroy({ where: { dataset_id }, transaction: transact })
    await DatasetSourceConfigDraft.destroy({ where: { dataset_id }, transaction: transact })
    await DatasourceDraft.destroy({ where: { dataset_id }, transaction: transact })
    await DatasetDraft.destroy({ where: { id: dataset_id }, transaction: transact })
}

//PUBLISH_DATASET
const publishDataset = async (configs: Record<string, any>) => {
    const { dataset_id } = configs
    await executeCommand(dataset_id, "PUBLISH_DATASET");
}

//CHECK_DATASET_IS_DENORM
const checkDatasetDenorm = async (payload: Record<string, any>) => {
    const { dataset } = payload
    const { dataset_id, type } = dataset
    if (type === DatasetType.MasterDataset) {
        const liveDatasets = await Dataset.findAll({ attributes: ["denorm_config"], raw: true }) || []
        const draftDatasets = await DatasetDraft.findAll({ attributes: ["denorm_config"], raw: true }) || []
        _.forEach([...liveDatasets, ...draftDatasets], datasets => {
            _.forEach(_.get(datasets, 'denorm_config.denorm_fields'), denorms => {
                if (_.get(denorms, "dataset_id") === dataset_id) {
                    logger.error(`Failed to retire dataset as it is used by other datasets:${dataset_id}`)
                    throw {
                        code: "DATASET_IN_USE",
                        errCode: "BAD_REQUEST",
                        message: "Failed to retire dataset as it is used by other datasets",
                        statusCode: 400
                    }
                }
            })
        })
    }
}

//SET_DATASET_TO_RETIRE
const setDatasetRetired = async (config: Record<string, any>) => {
    const { dataset, transact } = config;
    const { dataset_id } = dataset
    await Dataset.update({ status: DatasetStatus.Retired }, { where: { dataset_id }, transaction: transact })
    await DatasetSourceConfig.update({ status: DatasetStatus.Retired }, { where: { dataset_id }, transaction: transact })
    await Datasource.update({ status: DatasetStatus.Retired }, { where: { dataset_id }, transaction: transact })
    await DatasetTransformations.update({ status: DatasetStatus.Retired }, { where: { dataset_id }, transaction: transact })
}

//DELETE_SUPERVISORS
const deleteSupervisors = async (configs: Record<string, any>) => {
    const { dataset } = configs
    const { type, dataset_id } = dataset
    try {
        if (type !== DatasetType.MasterDataset) {
            const datasourceRefs = await Datasource.findAll({ where: { dataset_id }, attributes: ["datasource_ref"], raw: true })
            for (const sourceRefs of datasourceRefs) {
                const datasourceRef = _.get(sourceRefs, "datasource_ref")
                await druidHttpService.post(`/druid/indexer/v1/supervisor/${datasourceRef}/terminate`)
                logger.info(`Datasource ref ${datasourceRef} deleted from druid`)
            }
        }
    } catch (error: any) {
        logger.error({ error: _.get(error, "message"), message: `Failed to delete supervisors for dataset:${dataset_id}` })
    }
}

//RESTART_PIPELINE
const restartPipeline = async (config: Record<string, any>) => {
    const dataset_id = _.get(config, ["dataset", "dataset_id"])
    return executeCommand(dataset_id, "RESTART_PIPELINE")
}

const commandExecutors = {
    DELETE_DRAFT_DATASETS: deleteDataset,
    PUBLISH_DATASET: publishDataset,
    CHECK_DATASET_IS_DENORM: checkDatasetDenorm,
    SET_DATASET_TO_RETIRE: setDatasetRetired,
    DELETE_SUPERVISORS: deleteSupervisors,
    RESTART_PIPELINE: restartPipeline,
    VALIDATE_DATASET_CONFIGS: validateDataset
}

const getDraftDatasetRecord = async (dataset_id: string) => {
    return DatasetDraft.findOne({ where: { id: dataset_id }, raw: true });
}

const errorMessage = {
    DATASET_NOT_FOUND: {
        Delete: "Dataset not found to delete",
        Retire: "Dataset not found to retire",
        ReadyToPublish: "Dataset not found to perform status transition to ready to publish",
        Live: "Dataset not found to perform status transition to live"
    },
    STATUS_INVALID: {
        Delete: "Failed to Delete dataset",
        Retire: "Failed to Retire dataset as it is not in live state",
        ReadyToPublish: "Failed to mark dataset Ready to publish as it not in draft state",
        Live: "Failed to mark dataset Live as it is not in ready to publish state"
    }
}

const getErrorMessage = (status: string, code: string) => {
    return _.get(errorMessage, [code, status]) || "Failed to perform status transition"
}

export default datasetStatusTransition;