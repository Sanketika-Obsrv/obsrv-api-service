import moment from "moment";
import * as _ from "lodash";
import { getFileKey } from "../../utils/common";
import { config } from "../../configs/Config";
import { logger } from "@azure/storage-blob";
import { Storage } from "@google-cloud/storage"
import { FilterDataByDateRange, ICloudService } from "./types";
import { ChecksumAlgorithm } from "@aws-sdk/client-s3";

export class GCPStorageService implements ICloudService {
    private storage: any;
    constructor(config: any) {
        if (!_.get(config, "identity")) {
            throw new Error("GCLOUD__StorageService :: Required configuration is missing - [identity]");
        }
        if (!_.get(config, "credential")) {
            throw new Error("GCLOUD__StorageService :: Required configuration is missing - [credential]");
        }
        if (!_.get(config, "projectId")) {
            throw new Error("GCLOUD__StorageService :: Required configuration is missing - [projectId]");
        }
        const credentials = {
            "project_id": _.get(config, "projectId"),
            "private_key": _.get(config, "credential"),
            "client_email": _.get(config, "identity")
        }
        this.storage = new Storage({ credentials: credentials });
    }

    async getSignedUrls(container: string, filesList: any) {
        const generateSignedUrl = async (fileName: string) => {
            const options = {
                version: 'v4',
                action: 'read',
                expires: Date.now() + 1000 * 60 * 60, // one hour
            };

            try {
                const [url] = await this.storage
                    .bucket(container)
                    .file(fileName)
                    .getSignedUrl(options);
                return url;
            } catch (error) {
                logger.error(`Error generating signed URL for ${fileName}: ${error}`);
                console.error(error);
                return null;
            }
        }

        async function generateSignedUrls(fileNames: any) {
            const signedUrls = await Promise.all(fileNames.map((fileName: any) => generateSignedUrl(fileName)));
            return signedUrls;
        }

        return generateSignedUrls(filesList)
            .then(signedUrls => {
                const periodWiseFiles: any = {};
                const files: any = [];
                signedUrls.forEach(async (fileObject) => {
                    const period = getFileKey(fileObject);
                    if (_.has(periodWiseFiles, period))
                        periodWiseFiles[period].push(fileObject);
                    else {
                        periodWiseFiles[period] = [];
                        periodWiseFiles[period].push(fileObject);
                    }
                    files.push(fileObject);
                });
                return {
                    expiresAt: moment().add(config.exhaust_config.storage_url_expiry, 'seconds').toISOString(),
                    files: signedUrls,
                    periodWiseFiles,
                };
            })
            .catch(error => {
                logger.error("Error in generating signed URLs")
                console.error(error);
            });
    }

    async getFiles(container: string, container_prefix: string, type: string, dateRange: string, datasetId: string) {
        const filesList = await this.filterDataByRange(
            container,
            container_prefix,
            type,
            dateRange,
            datasetId
        )
        const signedUrlsList = await this.getSignedUrls(container, filesList);
        return signedUrlsList
    }

    async filterDataByRange(container: string, container_prefix: string, type: string, dateRange: any, datasetId: string): Promise<FilterDataByDateRange> {
        const startDate = moment(dateRange.from);
        const endDate = moment(dateRange.to);
        const result: any = [];
        for (let analysisDate = startDate; analysisDate <= endDate; analysisDate = analysisDate.add(1, "days")) {
            const pathPrefix = `${container_prefix}/${type}/${datasetId}/${analysisDate.format(
                "YYYY-MM-DD"
            )}`;
            try {
                const [files] = await this.storage.bucket(container).getFiles({
                    prefix: pathPrefix
                });
                files.forEach((file: any) => {
                    if (file?.name) {
                        result.push(file?.name)
                    }
                });
            }
            catch (error) {
                logger.error(error)
                console.log(error)
                return result
            }
        }
        return result
    }
}