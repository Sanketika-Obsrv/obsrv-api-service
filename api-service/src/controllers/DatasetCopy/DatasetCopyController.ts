import { Request, Response } from "express";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import * as _ from "lodash";
import { schemaValidation } from "../../services/ValidationService";
import validationSchema from "./DatasetCopyValidationSchema.json";
import { getDataset, getDraftDataset, getDraftTransformations, getTransformations } from "../../services/DatasetService";
import { getDatasourceList, getDraftDatasourceList } from "../../services/DatasourceService";
import { getDatasetSourceConfigList, getDraftDatasetSourceConfigList } from "../../services/DatasetSourceConfigService";
import { sequelize } from "../../connections/databaseConnection";
import { DatasetDraft } from "../../models/DatasetDraft";
import { updateDataset, updateRecords } from "./DatasetCopyHelper";
import { DatasetTransformationsDraft } from "../../models/TransformationDraft";
import { DatasourceDraft } from "../../models/DatasourceDraft";
import { DatasetSourceConfigDraft } from "../../models/DatasetSourceConfigDraft";
import { ErrorObject } from "../../types/ResponseModel";
import { DatasetStatus } from "../../types/DatasetModels";
import { defaultMasterConfig } from "../../configs/DatasetConfigDefault";
const version = defaultMasterConfig.version;
export const apiId = "api.dataset.copy";
let requestBody: any;

export const datasetCopy = async (req: Request, res: Response) => {
    requestBody = _.get(req, "body");
    try {
        const resmsgid = _.get(res, "resmsgid");
        const msgid = _.get(req, "body.params.msgid");
        const datasetId = _.get(req, "body.request.datasetId");
        const isLive = _.get(req, "body.request.isLive");
        const newDatasetId = _.get(req, "body.request.newDatasetId");
        let dataset: any;
        let dataSourceRecords: any;
        let datasetSourceConfigRecords: any;
        let datasetTransformationsRecords: any;
        const isValidSchema = schemaValidation(requestBody, validationSchema);

        if (!isValidSchema?.isValid) {
            logger.error({ apiId, msgid, resmsgid, requestBody, message: isValidSchema?.message, code: "QUERY_TEMPLATE_INVALID_INPUT" })
            return ResponseHandler.errorResponse({ message: isValidSchema?.message, statusCode: 400, errCode: "BAD_REQUEST", code: "QUERY_TEMPLATE_INVALID_INPUT" }, req, res);
        }

        if (isLive) {
            dataset = await getDataset(datasetId, true);
            dataSourceRecords = await getDatasourceList(datasetId, true);
            datasetSourceConfigRecords = await getDatasetSourceConfigList(datasetId);
            datasetTransformationsRecords = await getTransformations(datasetId);
            updateDataset(dataset);
        }

        if (!isLive) {
            const dataset_id = `${datasetId}.${version}`
            dataset = await getDraftDataset(datasetId);
            dataSourceRecords = await getDraftDatasourceList(dataset_id, true);
            datasetSourceConfigRecords = await getDraftDatasetSourceConfigList(dataset_id);
            datasetTransformationsRecords = await getDraftTransformations(dataset_id);
        }

        updateRecords({ datasetTransformationsRecords, datasetSourceConfigRecords, dataSourceRecords, dataset }, datasetId, newDatasetId, isLive)
        await saveRecords({ dataset, datasetTransformationsRecords, datasetSourceConfigRecords, dataSourceRecords });
        return ResponseHandler.successResponse(req, res, { status: 200, data: { dataset_id: _.get(dataset, "id"), message: `Dataset clone successful` } });
    }
    catch (error: any) {
        logger.error({ error, apiId, requestBody, resmsgid: _.get(res, "resmsgid"), code: "INTERNAL_SERVER_ERROR", message: "Failed to clone dataset" })
        const code = _.get(error, "code") || "INTERNAL_SERVER_ERROR"
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if (!statusCode || statusCode == 500) {
            errorMessage = { code, message: "Failed to clone dataset" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

const saveRecords = async (payload: any) => {
    const { dataset, datasetTransformationsRecords, datasetSourceConfigRecords, dataSourceRecords } = payload || {};
    const transactions = await sequelize.transaction();
    try {
        await Promise.all([dataset].map(async (datasetRecord: any) => {
            await DatasetDraft.create(datasetRecord, { transaction: transactions })
        }))
        await Promise.all(datasetTransformationsRecords.map(async (datasetTransformation: any) => {
            _.set(datasetTransformation, 'status', DatasetStatus.Draft)
            _.set(datasetTransformation, 'updated_date', new Date());
            await DatasetTransformationsDraft.create(datasetTransformation, { transaction: transactions })
        }))
        await Promise.all(datasetSourceConfigRecords.map(async (datasetSourceConfig: any) => {
            _.set(datasetSourceConfig, 'updated_date', new Date());
            _.set(datasetSourceConfig, 'status', DatasetStatus.Draft);
            await DatasetSourceConfigDraft.create(datasetSourceConfig, { transaction: transactions })
        }))
        await Promise.all(dataSourceRecords.map(async (datasource: any) => {
            _.set(datasource, 'status', DatasetStatus.Draft);
            _.set(datasource, 'updated_date', new Date());
            await DatasourceDraft.create(datasource, { transaction: transactions })
        }))
        await transactions.commit();
    }
    catch (error: any) {
        logger.error({ error: error?.errors, apiId, resmsgid: _.get(requestBody, "params.resmsgid"), requestBody, message: "Failed to clone dataset", code: "DATASET_COPY_FAILURE" })
        throw { message: `Failed to clone dataset`, statusCode: 400, errCode: "BAD_REQUEST", code: "DATASET_COPY_FAILURE" } as ErrorObject;
    }
}
