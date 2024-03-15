import _ from "lodash";
import { DatasetDraft } from "../models/DatasetDraft";
import { query } from "../connections/databaseConnection";

export const validateDenormConfig = (denormConfig: Record<string, any>): boolean => {
    if (denormConfig && _.isArray(_.get(denormConfig, 'denorm_fields'))) {
        const denormFields = _.get(denormConfig, "denorm_fields")
        const denormOutKeys = _.map(denormFields, field => _.get(field, "denorm_out_field"))
        const isUniqDenormOutKey: boolean = _.size(_.uniq(denormOutKeys)) === _.size(denormOutKeys)
        return isUniqDenormOutKey;
    }
    return true
}

export const setRedisDBConfig = async (datasetConfig: Record<string, any>): Promise<Record<string, any>> => {
    let nextRedisDB = datasetConfig.redis_db;
    const { results }: any = await query("SELECT nextval('redis_db_index')")
    if (!_.isEmpty(results)) nextRedisDB = parseInt(_.get(results, "[0].nextval"));
    return _.assign(datasetConfig, { "redis_db": nextRedisDB })
}

export const getDraftDataset = async (dataset_id: string) => {
    return DatasetDraft.findOne({ where: { dataset_id }, raw: true });
}