import _ from "lodash";
import { DatasetDraft } from "../models/DatasetDraft";
import { DatasetType } from "../types/DatasetModels";
import { defaultConfig } from "../resources/schemas/DatasetConfigDefault"

const isUniqueDenormKey = (value: any, index: any, array: any) => {
    return array.indexOf(value) === array.lastIndexOf(value);
}

const validateDenormConfig = (denorm_config: Record<string, any>) => {
    if (denorm_config && _.has(denorm_config, 'denorm_fields')) {
        const denormOutKeys = _.map(_.get(denorm_config, "denorm_fields"), field => _.get(field, "denorm_out_field"))
        const isUniqDenormOutKey = _.every(denormOutKeys, isUniqueDenormKey);
        if (!isUniqDenormOutKey) throw { statusCode: 400, message: "Duplicate found for denorm output key", errCode: "BAD_REQUEST" }
        return isUniqDenormOutKey;
    }
}

const mergeConfigs = (defaultConfig: Record<string, any>, requestPayload: Record<string, any>) => {
    const { id, dataset_id, version } = requestPayload;
    const recordId = !id && `${dataset_id}.${version}`
    const datasetConfigs = { ...defaultConfig, ...(recordId && { id: recordId }) }
    const mergeObjects = (target: any, source: any) => {
        for (const key of Object.keys(source)) {
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


const getDatasetDefaults = (payload: Record<string, any>) => {
    validateDenormConfig(_.get(payload, "denorm_config"))
    const getDefaults = defaultConfig.dataset
    const datasetPayload = mergeConfigs(getDefaults, payload)
    return datasetPayload
}

const getMasterDatasetDefaults = (payload: Record<string, any>) => {
    const getDefaults = defaultConfig.dataset
    const masterDatasetPayload = mergeConfigs(getDefaults, payload)
    return masterDatasetPayload;
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

export const getDefaultValue = (payload: Record<string, any>) => {
    const datasetType = _.get(payload, "type");
    const getDatasetDefaults = getDefaultHandler(datasetType)
    return getDatasetDefaults(payload)
}

export const checkDatasetExists = async (dataset_id: string) => {
    const datasetExists = await DatasetDraft.findOne({ where: { dataset_id }, raw: true });
    if (datasetExists) throw ({ message: "Dataset Record Already exists", statusCode: 409, errCode: "CONFLICT" });
    return datasetExists;
}
