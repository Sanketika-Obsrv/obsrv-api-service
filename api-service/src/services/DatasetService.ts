import _ from "lodash";
import { DatasetDraft } from "../models/DatasetDraft";

export const getDuplicateDenormKey = (denormConfig: Record<string, any>): Array<string> => {
    if (denormConfig && _.isArray(_.get(denormConfig, 'denorm_fields'))) {
        const denormFields = _.get(denormConfig, "denorm_fields")
        const denormOutKeys = _.map(denormFields, field => _.get(field, "denorm_out_field"))
        const isUniqDenormOutKey = _.filter(denormOutKeys, (val, i, iteratee) => _.includes(iteratee, val, i + 1))
        return isUniqDenormOutKey;
    }
    return []
}

export const getDraftDataset = async (dataset_id: string) => {
    return DatasetDraft.findOne({ where: { dataset_id }, raw: true });
}