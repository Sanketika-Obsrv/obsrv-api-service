import { Datasource } from "../models/Datasource";

export const getDatasourceList = async (datasourceName: string) => {
    const dataSource = await Datasource.findAll({
        where: {
            dataset_id: datasourceName,
        },
    });
    return dataSource
}