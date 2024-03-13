import _ from "lodash";

const validateDenormConfig = (denorm_config: Record<string, any>) => {
    return denorm_config;
}

export const removeNullValues = (payload: Record<string, any>) => {
    return payload;
}

const setDatasetDefaults = (payload: Record<string, any>) => {
    validateDenormConfig(_.get(payload, "denorm_config"))
    removeNullValues(payload)
    return payload;
}

const setMasterDatasetDefaults = (payload: Record<string, any>) => {
    validateDenormConfig(_.get(payload, "denorm_config"))
    removeNullValues(payload)
    return payload;
}

export const setDefaults = (payload: Record<string, any>) => {
    const dataset_type = _.get(payload, "type")
    switch (dataset_type) {
        case "dataset": {
            return setDatasetDefaults(payload);
        }
        case "master-dataset": {
            return setMasterDatasetDefaults(payload);
        }
        default:
            return {};
    }
}

export const checkRecordExists = async (datasetId: string) => {
    return datasetId;
}
