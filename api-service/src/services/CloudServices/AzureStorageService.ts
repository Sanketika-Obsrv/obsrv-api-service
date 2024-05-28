import moment from "moment";
import logger from "../../logger";
import * as _ from "lodash";
import { config as globalConfig } from "../../configs/Config";
const READ = "r";
const WRITE = "w";
import {
    BlobServiceClient,
    StorageSharedKeyCredential,
    generateBlobSASQueryParameters,
    ContainerClient,
} from "@azure/storage-blob"
import { getFileKey } from "../../utils/common"
import { FilterDataByDateRange, ICloudService } from "./types";
import { URLAccess } from "../../types/SampleURLModel";

export class AzureStorageService implements ICloudService {
    sharedKeyCredential: any;
    blobService: any;
    containerClient: any;
    constructor(config: any) {
        if (!_.get(config, "identity") || !_.get(config, "credential")) {
            throw new Error(
                "Azure__StorageService :: Required configuration is missing"
            );
        }
        try {
            this.sharedKeyCredential = new StorageSharedKeyCredential(
                config?.identity,
                config?.credential
            );
            this.blobService = new BlobServiceClient(
                `https://${config?.identity}.blob.core.windows.net`,
                this.sharedKeyCredential
            );
            this.containerClient = new ContainerClient(
                `https://${config?.identity}.blob.core.windows.net/${globalConfig?.cloud_config?.container}`,
                this.sharedKeyCredential
            );
        } catch (error) {
            logger.info("Azure__StorageService - Unable to create Azure client");
        }
    }

    getUrl(container: string, blob: any, SASToken: any) {
        const blobClient = this.blobService
            .getContainerClient(container)
            .getBlobClient(blob);
        return `${blobClient.url}?${SASToken}`;
    }

    generateSharedAccessSignature(
        container: string,
        blob: any,
        sharedAccessPolicy: any,
        headers: any
    ) {
        const sasToken = generateBlobSASQueryParameters(
            {
                containerName: container,
                blobName: blob,
                ...sharedAccessPolicy.AccessPolicy,
                ...headers,
            },
            this.sharedKeyCredential
        ).toString();
        return sasToken;
    }

    getSignedUrl(container: string, filePath: string, expiresIn = 3600, permission = "") {
        const startDate = new Date();
        const expiryDate = new Date(startDate);
        expiryDate.setMinutes(startDate.getMinutes() + Math.floor(expiresIn / 60));
        const sharedAccessPolicy = {
            AccessPolicy: {
                permissions: permission !== "" ? permission : READ,
                startsOn: startDate,
                expiresOn: expiryDate,
            },
        };
        const azureHeaders = {};
        const token = this.generateSharedAccessSignature(
            container,
            filePath,
            sharedAccessPolicy,
            azureHeaders
        );
        const sasUrl = this.getUrl(container, filePath, token);
        return Promise.resolve(sasUrl);
    }

    async getPreSignedUrl(container: string, fileName: string, prefix = undefined, access?: string, urlExpiry?: number) {
        if (prefix) {
            fileName = prefix + fileName;
        }
        let permission = READ;
        const storageURLExpiry = urlExpiry ? urlExpiry : globalConfig.cloud_config.storage_url_expiry
        if (access) {
            if (access == URLAccess.Write){
                permission = WRITE
            } 
        }

        const presignedURL = await this.getSignedUrl(
            container,
            fileName,
            storageURLExpiry,
            permission
        );
        return presignedURL;
    }

    generateSignedURLs(container: any, filesList: any, access?: string, urlExpiry?: number) {
        const signedURLs = filesList.map((fileNameWithPrefix: any) => {
            return new Promise((resolve, reject) => {
                this.getPreSignedUrl(container, fileNameWithPrefix, undefined, access, urlExpiry)
                    .then((presignedURL) => {
                        const fileName = fileNameWithPrefix.split("/").pop();
                        resolve({ [fileName]: presignedURL });
                    })
                    .catch((error) => {
                        reject({ error: error.message });
                    });
            });
        });
        return signedURLs;
    }

    async getSignedUrls(container: any, filesList: any) {
        const signedUrlsPromises = this.generateSignedURLs(container, filesList)
        const signedUrlsList = await Promise.all(signedUrlsPromises);
        const files: any[] = []
        const periodWiseFiles: any = {};
        // Formatting response
        signedUrlsList.map(async (fileObject) => {
            const fileDetails = _.keys(fileObject);
            const fileUrl = _.values(fileObject)[0];
            const period = getFileKey(fileDetails[0]);
            if (_.has(periodWiseFiles, period))
                periodWiseFiles[period].push(fileUrl);
            else {
                periodWiseFiles[period] = [];
                periodWiseFiles[period].push(fileUrl);
            }
            files.push(fileUrl);
        });
        return {
            expiresAt: moment()
                .add(globalConfig.cloud_config.storage_url_expiry, "seconds")
                .toISOString(),
            files,
            periodWiseFiles,
        };
    }

    async getFiles(container: string, container_prefix: string, type: string, dateRange: string, datasetId: string) {
        const filesList = await this.filterDataByRange(
            container_prefix,
            type,
            dateRange,
            datasetId
        );
        const signedUrlsList = await this.getSignedUrls(
            container,
            filesList
        );
        return signedUrlsList;
    }

    async filterDataByRange(container_prefix: string, type: string, dateRange: any, datasetId: string): Promise<FilterDataByDateRange> {
        const startDate = moment(dateRange.from);
        const endDate = moment(dateRange.to);
        const promises = [];
        let result: any = []
        for (
            let analysisDate = startDate;
            analysisDate <= endDate;
            analysisDate = analysisDate.add(1, "days")
        ) {
            const pathPrefix = `${container_prefix}/${type}/${datasetId}/${analysisDate.format(
                "YYYY-MM-DD"
            )}`;
            try {
                const items = this.containerClient.listBlobsByHierarchy(
                    "/",
                    { prefix: pathPrefix }
                );
                for await (const item of items) {
                    if (item && item.kind === "blob") promises.push(item);
                }
            } catch (err) {
                logger.error(
                    `Unable to list the blobs present in directory ${pathPrefix}`
                );
                return result;
            }
        }
        if (promises.length > 0) result = promises
            .map((item: any) => { return item?.name });
        return result
    }
}