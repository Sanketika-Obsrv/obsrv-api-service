import { dbConnector } from "../routes/Router"
import { globalCache } from "../routes/Router";


function getDatasetConfigs() {
    return dbConnector.listRecords('datasets')
}

export const refreshDatasetConfigs = async () => {
    try {
        const data = await getDatasetConfigs();
        globalCache.set("dataset-config", data)
    }
    catch (err) {
        console.log(err);
        throw new Error("Failed to cache configs")
    }
}

