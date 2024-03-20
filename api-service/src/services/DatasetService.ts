import { Dataset } from "../models/Dataset";
import _ from "lodash";
import { DatasetDraft } from "../models/DatasetDraft";

export const getDataset = async (datasetId: string): Promise<any> => {
    const dataset = await Dataset.findOne({
        where: {
            id: datasetId,
        },
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

export const setApiId = async (req: any, apiId: string) => {
    return _.set(req, "id", apiId)
}