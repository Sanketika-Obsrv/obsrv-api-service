import { Request, Response } from "express";
import _ from "lodash";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { getDataset, getDraftDataset, setReqDatasetId } from "../../services/DatasetService";
import { ErrorObject } from "../../types/ResponseModel";
import { schemaValidation } from "../../services/ValidationService";
import DatasetStatusSchema from "../DatasetStatus/DatasetStatusSchemaValidation.json";
import ReadyToPublishSchema from "../DatasetStatus/ReadyToPublishSchema.json"
import httpStatus from "http-status";
import { sequelize } from "../../connections/databaseConnection";
import { DatasetTransformationsDraft } from "../../models/TransformationDraft";
import { DatasourceDraft } from "../../models/DatasourceDraft";
import { DatasetSourceConfigDraft } from "../../models/DatasetSourceConfigDraft";
import { DatasetDraft } from "../../models/DatasetDraft";
import axios from "axios";
import { config } from "../../configs/Config";
import { v4 } from 'uuid';
import { Dataset } from "../../models/Dataset";
import { DatasetAction, DatasetStatus, DatasetType } from "../../types/DatasetModels";
import { DatasetSourceConfig } from "../../models/DatasetSourceConfig";
import { Datasource } from "../../models/Datasource";
import { DatasetTransformations } from "../../models/Transformation";
import { druidHttpService } from "../QueryWrapper/SqlQueryWrapper";

export const apiId = "api.datasets.status";
export const errorCode = "DATASET_STATUS_FAILURE"
export const commandHttpService = axios.create({ baseURL: `${config.command_service_config.host}:${config.command_service_config.port}`, headers: { "Content-Type": "application/json" } });

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

const datasetStatus = async (req: Request, res: Response) => {
    const requestBody = req.body
    const msgid = _.get(req, ["body", "params", "msgid"]);
    const resmsgid = _.get(res, "resmsgid");
    const transact = await sequelize.transaction()
    try {
        const { dataset_id, status } = _.get(requestBody, "request");
        setReqDatasetId(req, dataset_id)

        const isRequestValid: Record<string, any> = schemaValidation(req.body, DatasetStatusSchema)
        if (!isRequestValid.isValid) {
            const code = "DATASET_STATUS_INVALID_INPUT"
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
            throw {
                code: "DATASET_NOT_FOUND",
                message: `Dataset not found to perform status transition to ${status}`,
                statusCode: 404,
                errCode: "NOT_FOUND"
            }
        }

        const allowedStatus = _.get(allowedTransitions, status)
        const datasetStatus = _.get(datasetRecord, "status")
        if (!_.includes(allowedStatus, datasetStatus)) {
            throw {
                code: `DATASET_${_.toUpper(status)}_FAILURE`,
                message: `Failed to ${status} dataset as it is in ${_.toLower(datasetStatus)} state`,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            }
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
    const { dataset, transact } = payload
    const { dataset_id, type } = dataset
    if (type === DatasetType.MasterDataset) {
        const liveDatasets = await Dataset.findAll({ attributes: ["denorm_config"], transaction: transact }) || []
        const draftDatasets = await DatasetDraft.findAll({ attributes: ["denorm_config"], transaction: transact }) || []
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

const executeCommand = async (id: string, command: string) => {
    const payload = {
        "id": v4(),
        "data": {
            "dataset_id": id,
            "command": command
        }
    }
    return commandHttpService.post(config.command_service_config.path, payload)
}

const getDraftDatasetRecord = async (dataset_id: string) => {
    return DatasetDraft.findOne({ where: { id: dataset_id }, raw: true });
}

export default datasetStatus;