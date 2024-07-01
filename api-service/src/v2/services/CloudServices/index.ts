import { config } from "../../configs/Config";
import { AWSStorageService } from "./AWSStorageService";
import { AzureStorageService } from "./AzureStorageService";
import { GCPStorageService } from "./GCPStorageService";
import * as _ from "lodash";

const cloudProviderName = _.get(config, "cloud_config.cloud_storage_provider");
const cloudConfig = _.get(config, "cloud_config.cloud_storage_config");
const cloudProviderConfig = _.isString(cloudConfig) ? JSON.parse(cloudConfig) : cloudConfig;

const initialiseServiceProvider = (provider: any, config: any): AzureStorageService | AWSStorageService | GCPStorageService => {
    switch (provider) {
        case "azure":
            return new AzureStorageService(config);
        case "aws":
            return new AWSStorageService(config);
        case "gcloud":
            return new GCPStorageService(config);
        default:
            throw new Error(`Client Cloud Service - ${provider} provider is not supported`);
    }
}

export const cloudProvider = initialiseServiceProvider(cloudProviderName, cloudProviderConfig);