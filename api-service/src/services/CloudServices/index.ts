import { AWSStorageService } from "./AWSStorageService";
import { AzureStorageService } from "./AzureStorageService";
import { GCPStorageService } from "./GCPStorageService";

export function init(provider: any) {
    switch (provider) {
        case "azure":
            return AzureStorageService;
        case "aws":
            return AWSStorageService;
        case "gcloud":
            return GCPStorageService;
        default:
            throw new Error(`Client Cloud Service - ${provider} provider is not supported`);
    }
}