import { DatasetSourceConfig } from "../models/DatasetSourceConfig";
import { DatasetSourceConfigDraft } from "../models/DatasetSourceConfigDraft";

export const getDatasetSourceConfigList = async (datasetId: string) => {
    const dataSource = await DatasetSourceConfig.findAll({
        where: {
            dataset_id: datasetId,
        },
        raw: true
    });
    return dataSource
}


export const getDraftDatasetSourceConfigList = async (datasetId: string) => {
    const dataSource = await DatasetSourceConfigDraft.findAll({
        where: {
            dataset_id: datasetId,
        },
        raw: true
    });
    return dataSource
}