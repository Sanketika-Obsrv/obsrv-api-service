import { Request, Response } from "express";
import _ from "lodash";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { getDataset, getDraftDataset, setReqDatasetId } from "../../services/DatasetService";
import { ErrorObject } from "../../types/ResponseModel";
import { schemaValidation } from "../../services/ValidationService";
import DatasetStatus from "../DatasetStatus/DatasetStatusSchemaValidation.json";
import httpStatus from "http-status";
import { sequelize } from "../../connections/databaseConnection";
import { DatasetTransformationsDraft } from "../../models/TransformationDraft";
import { DatasourceDraft } from "../../models/DatasourceDraft";
import { DatasetSourceConfigDraft } from "../../models/DatasetSourceConfigDraft";
import { DatasetDraft } from "../../models/DatasetDraft";
import axios from "axios";
import { config } from "../../configs/Config";
import { v4 as uuidv4 } from 'uuid';
import { Dataset } from "../../models/Dataset";
import { DatasetType } from "../../types/DatasetModels";
import { DatasetSourceConfig } from "../../models/DatasetSourceConfig";
import { Datasource } from "../../models/Datasource";
import { DatasetTransformations } from "../../models/Transformation";

export const apiId = "api.datasets.status";
export const errorCode = "DATASET_STATUS_FAILURE"
const druidHttpService = axios.create({ baseURL: `${config.query_api.druid.host}:${config.query_api.druid.port}`, headers: { "Content-Type": "application/json" } });
const commandHttpService = axios.create({ baseURL: `${config.command_api.host}:${config.command_api.port}` });
const commandServicePath = '/system/v1/dataset/command'

const datasetRead = async (req: Request, res: Response) => {
    const requestBody = req.body
    const msgid = _.get(req, ["body", "params", "msgid"]);
    const resmsgid = _.get(res, "resmsgid");
    const transact = await sequelize.transaction()
    try {
        const { dataset_id, status } = requestBody;
        setReqDatasetId(req, dataset_id)

        const isRequestValid: Record<string, any> = schemaValidation(req.body, DatasetStatus)
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

        await statusTransition({ dataset_id, status, transact })

        await transact.commit();
        logger.info({ apiId, msgid, requestBody, resmsgid, message: `Dataset Created Successfully with id:${dataset_id}` })
        ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: {} });
    } catch (error: any) {
        await transact.rollback();
        const code = _.get(error, "code") || errorCode
        logger.error(error, apiId, msgid, code, requestBody, resmsgid)
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code, message: "Failed to perform status transition on datase" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const publishDataset = async (configs: Record<string, any>) => {
    const { dataset_id, transact } = configs
    const dataset = await getDraftDataset(dataset_id)
    if (!dataset) {
        throw {
            code: "DATASET_NOT_FOUND",
            message: "Dataset not found",
            statusCode: 404,
            errCode: "NOT_FOUND"
        }
    }
    await DatasetTransformationsDraft.destroy({ where: { dataset_id }, transaction: transact })
    await DatasetSourceConfigDraft.destroy({ where: { dataset_id }, transaction: transact })
    await DatasourceDraft.destroy({ where: { dataset_id }, transaction: transact })
    await DatasetDraft.destroy({ where: { id: dataset_id }, transaction: transact })
    await commandHttpService.post(commandServicePath,
        {
            "id": uuidv4(),
            "data": {
                "dataset_id": dataset_id,
                "command": "PUBLISH_DATASET"
            }
        }
    )
}

const retireDataset = async (configs: Record<string, any>) => {
    const { dataset_id, transact } = configs
    const dataset = await getDataset(dataset_id, true)
    if (!dataset) {
        throw {
            code: "DATASET_NOT_FOUND",
            message: "Dataset not found",
            statusCode: 404,
            errCode: "NOT_FOUND"
        }
    }
    const isDatasetDenorm = await checkDatasetDenorm({ type: _.get(dataset, "type"), dataset_id })
    if (isDatasetDenorm) {
        throw {
            code: "DATASET_IN_USE",
            errorCode: "BAD_REQUEST",
            message: "Failed to retire dataset as it is used by other datasets",
            statusCode: 400
        }
    }
    await Dataset.update({ status: "Retired" }, { where: { dataset_id }, transaction: transact })
    await DatasetSourceConfig.update({ status: "Retired" }, { where: { dataset_id }, transaction: transact })
    await Datasource.update({ status: "Retired" }, { where: { dataset_id }, transaction: transact })
    await DatasetTransformations.update({ status: "Retired" }, { where: { dataset_id }, transaction: transact })
    // await deleteAlerts()
    await deleteSupervisors(dataset_id)
    await restartPipeline(dataset_id)
}

const restartPipeline = async (dataset_id: string) => {
    return commandHttpService.post(commandServicePath,
        {
            "id": uuidv4(),
            "data": {
                "dataset_id": dataset_id,
                "command": 'RESTART_PIPELINE'
            }
        }
    )
}

const deleteSupervisors = async (dataset_id: string) => {
    const datasourceRefs = await Dataset.findAll({ where: { dataset_id }, attributes: ["datasource_ref"], raw: true })
    for (let datasourceRef of datasourceRefs) {
        await druidHttpService.post(`/druid/indexer/v1/supervisor/${datasourceRef}/terminate`)
    }
}

const checkDatasetDenorm = async (payload: Record<string, any>) => {
    const { type, dataset_id } = payload
    if (type === DatasetType.MasterDataset) {
        const liveDatasets = await Dataset.findAll({
            where: sequelize.where(
                sequelize.literal(`EXISTS (
                SELECT 1
                FROM jsonb_array_elements("denorm_config"->'denorm_fields') AS element
                WHERE element->>'dataset_id' = '${dataset_id}'
              )`),
                true
            ), raw: true
        })
        const draftDatasets = await DatasetDraft.findAll({
            where: sequelize.where(
                sequelize.literal(`EXISTS (
                SELECT 1
                FROM jsonb_array_elements("denorm_config"->'denorm_fields') AS element
                WHERE element->>'id' = '${dataset_id}'
              )`),
                true
            ), raw: true
        })
        return _.size(_.compact([draftDatasets, liveDatasets]))
    }
}

const deleteDataset = async (configs: Record<string, any>) => {
    const { dataset_id, transact } = configs
    const dataset = await getDraftDataset(dataset_id)
    if (!dataset) {
        throw {
            code: "DATASET_NOT_FOUND",
            message: "Dataset not found",
            statusCode: 404,
            errCode: "NOT_FOUND"
        }
    }
    await DatasetTransformationsDraft.destroy({ where: { dataset_id }, transaction: transact })
    await DatasetSourceConfigDraft.destroy({ where: { dataset_id }, transaction: transact })
    await DatasourceDraft.destroy({ where: { dataset_id }, transaction: transact })
    await DatasetDraft.destroy({ where: { id: dataset_id }, transaction: transact })
}

const statusTransition = async (payload: Record<string, any>) => {
    const { status } = payload
    switch (status) {
        case 'Publish':
            publishDataset(payload)
            break;
        case 'Retire':
            retireDataset(payload)
            break;
        case 'Delete':
            deleteDataset(payload)
            break;
        default: return null;
    }
}

export default datasetRead;