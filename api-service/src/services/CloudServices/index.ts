import { AWSStorageService } from "./AWSStorageService";
import { AzureStorageService } from "./AzureStorageService";
import { GCPStorageService } from "./GCPStorageService";

export function init(provider: any, config: any) {
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