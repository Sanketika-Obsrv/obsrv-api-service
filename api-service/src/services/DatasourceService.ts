import { Op } from "sequelize";
import { Datasource } from "../models/Datasource";

export const getDatasourceList = async (datasetId?: string, raw: boolean = false) => {
    const query: any = { raw };
    if (datasetId) {
        query.where = { dataset_id: datasetId };
    }

    return Datasource.findAll(query);
};

// Fetch Live datasources whose datasource_ref OR datasource (alias) matches any
// of the given names. Used by the sql-query alias check to resolve table names.
export const getLiveDatasourcesByNames = async (names: string[]): Promise<{ datasource: string; datasource_ref: string }[]> => {
    return Datasource.findAll({
        where: {
            status: "Live",
            [Op.or]: [
                { datasource_ref: { [Op.in]: names } },
                { datasource: { [Op.in]: names } },
            ],
        },
        attributes: ["datasource", "datasource_ref"],
        raw: true,
    }) as any;
};










