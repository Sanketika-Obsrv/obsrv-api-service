import { Datasource } from "../models/Datasource";

export const getDatasourceList = async (datasetId?: string, raw: boolean = false) => {
    const query: any = { raw };
    if (datasetId) {
        query.where = { dataset_id: datasetId };
    }

    return Datasource.findAll(query);
};










