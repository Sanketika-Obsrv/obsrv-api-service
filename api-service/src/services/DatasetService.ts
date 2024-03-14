import _ from "lodash";
import { DatasetType } from "../types/DatasetModels";
import { defaultConfig } from "../configs/DatasetConfigDefault"
import { DatasetDraft } from "../models/DatasetDraft";
import { QueryTypes } from 'sequelize';

const isUniqueDenormKey = (value: any, index: any, array: any) => {
    return array.indexOf(value) === array.lastIndexOf(value);
}

const validateDenormConfig = (denormConfig: Record<string, any>) => {
    if (denormConfig && _.has(denormConfig, 'denorm_fields')) {
        const denormFields = _.get(denormConfig, "denorm_fields") || []
        const denormOutKeys = _.map(denormFields, field => _.get(field, "denorm_out_field"))
        const isUniqDenormOutKey = _.every(denormOutKeys, isUniqueDenormKey);
        if (!isUniqDenormOutKey) throw { statusCode: 400, message: "Duplicate found for denorm output key", errCode: "BAD_REQUEST" }
        return isUniqDenormOutKey;
    }
}

const mergeConfigs = (defaultConfig: Record<string, any>, requestPayload: Record<string, any>) => {
    const { id, dataset_id, version = 1 } = requestPayload;
    const recordId = !id && `${dataset_id}.${version}`
    const datasetConfigs = { ...defaultConfig, ...(recordId && { id: recordId }) }
    const mergeObjects = (target: any, source: any) => {
        for (const key of _.keys(source)) {
            if (typeof source[key] === 'object' && source[key] !== null) {
                target[key] = mergeObjects(target[key] || {}, source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }
    return mergeObjects(datasetConfigs, requestPayload);
}


const modifyMasterDatasetConfig = async (datasetConfig: Record<string, any>) => {
    let nextRedisDB = datasetConfig.redis_db;
    await DatasetDraft.sequelize?.query("SELECT nextval('redis_db_index')", { type: QueryTypes.SELECT })
        .then((rows: any) => {
            nextRedisDB = parseInt(rows[0].nextval);
        })
        .catch(error => {
            throw { message: error?.message }
        });
    return _.assign(datasetConfig, { "redis_db": nextRedisDB })
}

const getDatasetDefaults = async (payload: Record<string, any>) => {
    validateDenormConfig(_.get(payload, "denorm_config"))
    const getDefaults = defaultConfig.dataset
    const datasetPayload = mergeConfigs(getDefaults, payload)
    return datasetPayload
}

const getMasterDatasetDefaults = async (payload: Record<string, any>) => {
    const getDefaults = defaultConfig.master
    const masterDatasetPayload = mergeConfigs(getDefaults, payload)
    let datasetConfig = masterDatasetPayload.dataset_config
    datasetConfig = await modifyMasterDatasetConfig(datasetConfig);
    return _.assign(masterDatasetPayload, datasetConfig);
}

export const getDefaultHandler = (datasetType: string) => {
    switch (datasetType) {
        case DatasetType.Dataset: {
            return getDatasetDefaults;
        }
        case DatasetType.MasterDataset: {
            return getMasterDatasetDefaults;
        }
        default:
            return () => { };
    }
}

export const getDefaultValue = async (payload: Record<string, any>) => {
    const datasetType = _.get(payload, "type");
    const getDatasetDefaults = getDefaultHandler(datasetType)
    return await getDatasetDefaults(payload)
}

export const getDraftDatasetRecord = async (dataset_id: string) => {
    const datasetRecord = await DatasetDraft.findOne({ where: { dataset_id }, raw: true });
    return datasetRecord;
}