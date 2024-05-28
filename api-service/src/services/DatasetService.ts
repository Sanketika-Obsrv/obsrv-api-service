import { Dataset } from "../models/Dataset";
import _ from "lodash";
import { DatasetDraft } from "../models/DatasetDraft";
import { DatasetTransformationsDraft } from "../models/TransformationDraft";
import { Request } from "express";
import { generateIngestionSpec } from "./IngestionService";
import { ingestionConfig } from "../configs/IngestionConfig";
import { DatasetTransformations } from "../models/Transformation";

export const getDataset = async (datasetId: string, raw = false): Promise<any> => {
    const dataset = await Dataset.findOne({
        where: {
            id: datasetId,
        },
        raw: raw
    });
    return dataset
}

export const getDuplicateDenormKey = (denormConfig: Record<string, any>): Array<string> => {
    if (denormConfig && _.isArray(_.get(denormConfig, 'denorm_fields'))) {
        const denormFields = _.get(denormConfig, "denorm_fields")
        const denormOutKeys = _.map(denormFields, field => _.get(field, "denorm_out_field"))
        const duplicateDenormKeys: Array<string> = _.filter(denormOutKeys, (item: string, index: number) => _.indexOf(denormOutKeys, item) !== index);
        return duplicateDenormKeys;
    }
    return []
}

export const getDraftDataset = async (dataset_id: string) => {
    return DatasetDraft.findOne({ where: { dataset_id }, raw: true });
}

export const getDraftTransformations = async (dataset_id: string) => {
    return DatasetTransformationsDraft.findAll({ where: { dataset_id }, raw: true });
}

export const getTransformations = async (dataset_id: string) => {
    return DatasetTransformations.findAll({ where: { dataset_id }, raw: true });
}

export const setReqDatasetId = (req: Request, dataset_id: string) => {
    if (dataset_id) {
        return _.set(req, "dataset_id", dataset_id)
    }
}

export const getDuplicateConfigs = (configs: Array<string | any>) => {
    return _.filter(configs, (item: string, index: number) => _.indexOf(configs, item) !== index);
}

export const generateDataSource = (payload: Record<string, any>) => {
    const { id } = payload
    const ingestionSpec = generateIngestionSpec(payload)
    const dataSource = getDataSource({ ingestionSpec, id })
    return dataSource
}

const getDataSource = (ingestionPayload: Record<string, any>) => {
    const { ingestionSpec, id } = ingestionPayload
    const dataSource = `${id}_${_.toLower(ingestionConfig.granularitySpec.segmentGranularity)}`
    const dataSourceId = `${id}_${dataSource}`
    return {
        id: dataSourceId,
        datasource: dataSource,
        dataset_id: id,
        ingestion_spec: ingestionSpec,
        datasource_ref: dataSource
    }
}