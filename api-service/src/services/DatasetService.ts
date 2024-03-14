import { Dataset } from "../models/Dataset";

export const getDataset = async (datasetId: string) => {
    const dataset = await Dataset.findOne({
        where: {
            id: datasetId,
        },
    });
    if (dataset !== null) {
        return dataset
    }
    else {
        throw {
            "message": "Dataset with id not found",
            "statusCode": 404,
            "errCode": "BAD_REQUEST"
        }
    }
}