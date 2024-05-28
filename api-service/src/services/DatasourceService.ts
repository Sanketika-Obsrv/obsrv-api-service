import { Datasource } from "../models/Datasource";
import { DatasourceDraft } from "../models/DatasourceDraft";

export const getDatasourceList = async (datasetId: string, raw = false) => {
    const dataSource = await Datasource.findAll({
        where: {
            dataset_id: datasetId,
        },
        raw: raw
    });
    return dataSource
}

export const getDraftDatasourceList = async (datasetId: string, raw = false) => {
    const dataSource = await DatasourceDraft.findAll({
        where: {
            dataset_id: datasetId,
        },
        raw: raw
    });
    return dataSource
}

export const getDatasource = async (datasetId: string) => {
    const dataSource = await Datasource.findOne({
        where: {
            dataset_id: datasetId,
        },
    });
    return dataSource
}