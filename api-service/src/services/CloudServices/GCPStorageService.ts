import moment from "moment";
import * as _ from "lodash";
import { getFileKey } from "../../utils/common";
import { config } from "../../configs/Config";
import { logger } from "@azure/storage-blob";
import { Storage } from "@google-cloud/storage"
import { FilterDataByDateRange, ICloudService } from "./types";
import { URLAccess } from "../../types/SampleURLModel";

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

    async getPreSignedUrl(container: string, fileName: string, access?: string, urlExpiry?: number) {
        let action = URLAccess.Read
        if (access) {
            if (access === URLAccess.Write) {
                action = URLAccess.Write
            }
        }
        const containerURLExpiry = urlExpiry ? 1000 * urlExpiry : 1000 * 60 * 60

        const options = {
            version: 'v4',
            action,
            expires: Date.now() + containerURLExpiry, // one hour
        };
        const [url] = await this.storage
            .bucket(container)
            .file(fileName)
            .getSignedUrl(options);
        return url;
    }

    generateSignedURLs(container: string, filesList: any, access?: string, urlExpiry?: number) {
        const signedURLs = filesList.map((fileNameWithPrefix: any) => {
            return new Promise((resolve, reject) => {
                this.getPreSignedUrl(container, fileNameWithPrefix, access, urlExpiry)
                    .then((url) => {
                        const fileName = fileNameWithPrefix.split("/").pop();
                        resolve({ [fileName]: url })
                    })
                    .catch((error) => {
                        reject({ error: error.message });
                    })
            })
        })
        return signedURLs;
    }

    async getSignedUrls(container: string, filesList: any) {
        const signedURLPromises = this.generateSignedURLs(container, filesList)

        async function generateSignedUrls() {
            const signedUrls = await Promise.all(signedURLPromises);
            return signedUrls;
        }

        return generateSignedUrls()
            .then(signedUrlList => {
                const periodWiseFiles: any = {};
                const files: any = [];
                const signedUrls = _.flattenDeep(_.map(signedUrlList, url => {
                    const values = _.values(url)
                    return values
                }))
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
                    expiresAt: moment().add(config.cloud_config.storage_url_expiry, 'seconds').toISOString(),
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
                return result
            }
        }
        return result
    }
}