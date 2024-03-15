import _ from "lodash";
import { DatasetDraft } from "../models/DatasetDraft";

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