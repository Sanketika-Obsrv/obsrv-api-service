import { Dataset } from "../models/Dataset";

export const getDataset = async (datasetId: string): Promise<any> => {
    const dataset = await Dataset.findOne({
        where: {
            id: datasetId,
        },
    });
    return dataset
}