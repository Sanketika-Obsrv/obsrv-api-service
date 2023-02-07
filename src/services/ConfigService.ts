import { config } from "../configs/config";
import { DataSetConfig } from "../models/DatasetModels";
export class ConfigService {

    public suggestConfig(): DataSetConfig {
        return this.getDefaultConfig()
    }

    public getDefaultConfig(): DataSetConfig {
        return config.datasetConfig
    }
}