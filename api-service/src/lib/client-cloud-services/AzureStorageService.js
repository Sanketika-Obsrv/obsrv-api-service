/**
 * @file        - Azure Storage Service
 * @exports     - `AzureStorageService`
 * @since       - 5.0.1
 * @version     - 2.0.0
 * @implements  - BaseStorageService
 *
 * @see {@link https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob/?view=azure-node-latest | Azure Blob Documentation}
 * @see {@link https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/storage/storage-blob/MigrationGuide.md#uploading-a-blob-to-the-container | Azure Migration Guide}
 */

const BaseStorageService = require("./BaseStorageService");
const { logger } = require("@project-sunbird/logger");
const _ = require("lodash");
const { TextDecoder } = require("util");
const { config: globalConfig } = require("../../configs/Config");
const moment = require("moment");
const {
    BlobServiceClient,
    StorageSharedKeyCredential,
    generateBlobSASQueryParameters,
    ContainerClient,
} = require("@azure/storage-blob");
const { getFileKey } = require("../../utils/common");
const READ = "r";

class AzureStorageService extends BaseStorageService {
    constructor(config) {
        super();
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
                `https://${config?.identity}.blob.core.windows.net/${globalConfig?.exhaust_config?.container}`,
                this.sharedKeyCredential
            );
        } catch (error) {
            logger.info({
                msg: "Azure__StorageService - Unable to create Azure client",
            });
        }
    }

    async fileExists(container, fileToGet, callback) {
        if (!container || !fileToGet || !callback)
            throw new Error("Invalid arguments");
        logger.info({
            msg:
                "Azure__StorageService - fileExists called for container " +
                container +
                " for file " +
                fileToGet,
        });
        const blobClient = this.blobService
            .getContainerClient(container)
            .getBlobClient(fileToGet);
        try {
            const blobProperties = await blobClient.getProperties();
            if (blobProperties) {
                const response = {
                    exists: true,
                };
                callback(null, response);
            }
        } catch (error) {
            callback(error);
        }
    }

    /**
     * @description                                                     - Retrieves a shared access signature token
     * @param  { string } container                                     - Container name
     * @param  { string } blob                                          - Blob to be fetched
     * @param  { azure.common.SharedAccessPolicy } sharedAccessPolicy   - Shared access policy
     * @param  { azure.common.ContentSettingsHeaders } headers          - Optional header values to set for a blob returned wth this SAS
     * @return { string }                                               - The shared access signature
     */
    generateSharedAccessSignature(
        container,
        blob,
        sharedAccessPolicy,
        headers
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

    /**
     * @description                                                    - Retrieves a blob or container URL
     * @param  { string } container                                    - Container name
     * @param  { string } blob                                         - Blob to be fetched
     * @param  { string } SASToken                                     - Shared Access Signature token
     * @return { string }                                              - Formatted URL string
     */
    getUrl(container, blob, SASToken) {
        const blobClient = this.blobService
            .getContainerClient(container)
            .getBlobClient(blob);
        return `${blobClient.url}?${SASToken}`;
    }

    async getBlobProperties(request, callback) {
        logger.info({
            msg:
                "Azure__StorageService - getBlobProperties called for container " +
                request.container +
                " for file " +
                request.file,
        });
        const blobClient = this.blobService
            .getContainerClient(request.container)
            .getBlobClient(request.file);
        try {
            const blobProperties = await blobClient.getProperties();
            if (blobProperties) {
                blobProperties.reportname = request.reportname;
                blobProperties.filename = request.file;
                blobProperties.statusCode = 200;
                callback(null, blobProperties);
            }
        } catch (error) {
            logger.error({
                msg: "Azure__StorageService : readStream error - Error with status code 404",
            });
            callback({
                msg: "NotFound",
                statusCode: error.statusCode,
                filename: request.file,
                reportname: request.reportname,
            });
        }
    }

    async getFileAsText(
        container = undefined,
        fileToGet = undefined,
        prefix = undefined,
        callback
    ) {
        const blobClient = this.blobService
            .getContainerClient(container)
            .getBlobClient(fileToGet);
        try {
            const downloadResponse = await blobClient.download(0);
            const textDecoder = new TextDecoder("utf-8");
            const content = [];
            for await (const chunk of downloadResponse.readableStreamBody) {
                content.push(textDecoder.decode(chunk));
            }
            const text = content.join("");
            logger.info({
                msg:
                    "Azure__StorageService : getFileAsText success for container " +
                    container +
                    " for file " +
                    fileToGet,
            });
            callback(null, text);
        } catch (error) {
            logger.error({
                msg: "Azure__StorageService : getFileAsText error => ",
                error,
            });
            delete error.request;
            delete error.response;
            delete error.details;
            callback(error);
        }
    }

    upload(container, fileName, filePath, callback) {
        throw new Error("AzureStorageService :: upload() must be implemented");
    }

    async getPreSignedUrl(container, fileName, prefix = undefined) {
        if (prefix) {
            fileName = prefix + fileName;
        }
        const presignedURL = await this.getSignedUrl(
            container,
            fileName,
            globalConfig.exhaust_config.storage_url_expiry
        );
        return presignedURL;
    }

    /**
     * @description                   - Generates a pre-signed URL for a specific operation on a file in Azure storage.
     * @param {string} container      - Azure container or bucket name.
     * @param {string} filePath       - Path to the file within the container.
     * @param {number} expiresIn      - Optional. Number of seconds before the pre-signed URL expires.
     * @param {string} permission     - Optional. The permission for the operation (e.g., READ, WRITE).
     * @returns {Promise<string>}     - A promise that resolves to the pre-signed URL.
     */
    getSignedUrl(container, filePath, expiresIn = 3600, permission = "") {
        let startDate = new Date();
        let expiryDate = new Date(startDate);
        expiryDate.setMinutes(startDate.getMinutes() + expiresIn);
        startDate.setMinutes(startDate.getMinutes() - expiresIn);
        let sharedAccessPolicy = {
            AccessPolicy: {
                permissions: permission !== "" ? permission : READ,
                startsOn: startDate,
                expiresOn: expiryDate,
            },
        };
        let azureHeaders = {};
        let token = this.generateSharedAccessSignature(
            container,
            filePath,
            sharedAccessPolicy,
            azureHeaders
        );
        let sasUrl = this.getUrl(container, filePath, token);
        return Promise.resolve(sasUrl);
    }

    /**
     * @description                     - Generates a pre-signed URL for downloading a file from the Azure storage.
     * @param {string} container        - Azure container or bucket name.
     * @param {string} filePath         - Path to the file within the container.
     * @param {number} expiresIn        - Optional. Number of seconds before the pre-signed URL expires.
     * @returns {Promise<string>}       - A promise that resolves to the downloadable URL.
     */
    getDownloadableUrl(container, filePath, expiresIn = 3600) {
        let startDate = new Date();
        let expiryDate = new Date(startDate);
        expiryDate.setMinutes(startDate.getMinutes() + expiresIn);
        let sharedAccessPolicy = {
            AccessPolicy: {
                permissions: READ,
                startsOn: startDate,
                expiresOn: expiryDate,
            },
        };
        let azureHeaders = {};
        let token = this.generateSharedAccessSignature(
            container,
            filePath,
            sharedAccessPolicy,
            azureHeaders
        );
        let downloadableUrl = this.getUrl(container, filePath, token);
        return Promise.resolve(downloadableUrl);
    }

    /**
     * @description                     - Generates a ingestion specification for a file.
     * @param {string} container        - Bucket name.
     * @param {string} filePath         - Path to the file in the bucket.
     * @returns {Promise<object>}       - A Promise that resolves to the Druid ingestion specification.
     */
    getFileUrlForIngestion(container, filePath) {
        let druidSpec = {
            type: "azure",
            uris: [`azure://${container}/${filePath}`],
        };
        return Promise.resolve(druidSpec);
    }

    /**
     * @description                     - Function to get file download URLs from S3 bucket
     * @param  {string} container       - Bucket name to fetch the files from
     * @param  {Array} filesList         - List of file keys obtained for generating signed urls for download
     */
    async getFilesSignedUrls(container, filesList) {
        const signedUrlsPromises = filesList.map((fileNameWithPrefix) => {
            return new Promise(async (resolve, reject) => {
                const presignedURL = await this.getPreSignedUrl(
                    container,
                    fileNameWithPrefix
                );
                const fileName = fileNameWithPrefix.split("/").pop();
                resolve({ [fileName]: presignedURL });
            });
        });
        const signedUrlsList = await Promise.all(signedUrlsPromises);
        const periodWiseFiles = {};
        const files = [];
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
                .add(globalConfig.exhaust_config.storage_url_expiry, "seconds")
                .toISOString(),
            files,
            periodWiseFiles,
        };
    }

    /**
     * @description                     - Function to get file names from container for a specific date range
     * @param  {string} container       - container name to fetch the files from
     * @param  {string} container_prefix - Prefix of the path if the files are nested
     * @param  {string} type            - Folder name/Type of data to fetch the files for
     * @param  {string} dateRange       - Range of time interval, to get the files for
     * @param  {string} datasetId       - Dataset Id to fetch the files for
     */
    async filterDataByRange(
        container,
        container_prefix,
        type,
        dateRange,
        datasetId
    ) {
        let startDate = moment(dateRange.from);
        let endDate = moment(dateRange.to);
        let result = [];
        let promises = [];
        for (
            let analysisDate = startDate;
            analysisDate <= endDate;
            analysisDate = analysisDate.add(1, "days")
        ) {
            promises.push(
                new Promise(async (resolve, reject) => {
                    const pathPrefix = `${container_prefix}/${type}/${datasetId}/${analysisDate.format(
                        "YYYY-MM-DD"
                    )}`;
                    try {
                        const items = this.containerClient.listBlobsByHierarchy(
                            "/",
                            { prefix: pathPrefix }
                        );
                        for await (const item of items) {
                            if (item && item.kind === "blob") resolve(item);
                            else resolve(null);
                            return;
                        }
                    } catch (err) {
                        console.log(
                            `Unable to list the blobs present in directory ${pathPrefix}`
                        );
                        console.log(err);
                        reject(err);
                        return;
                    }
                })
            );
        }
        try {
            result = await Promise.all(promises);
            if(result.length > 0) result = result.map((item) => item.name);
            return result;
        } catch (err) {
            console.log(err);
            return [];
        }
    }

    /**
     * @description                     - Function to get file names S3 bucket for a specific date range
     * @param  {String} container       - Bucket name to fetch the files from
     * @param  {String} container_prefix - Prefix of the path if the files are nested
     * @param  {String} type            - Folder name/Type of data to fetch the files for
     * @param  {String} dateRange       - Range of time interval, to get the files for
     * @param  {String} datasetId       - Dataset Id to fetch the files for
     */
    async getFiles(container, container_prefix, type, dateRange, datasetId) {
        const filesList = await this.filterDataByRange(
            container,
            container_prefix,
            type,
            dateRange,
            datasetId
        );
        const signedUrlsList = await this.getFilesSignedUrls(
            container,
            filesList
        );
        return signedUrlsList;
    }
}

module.exports = AzureStorageService;
