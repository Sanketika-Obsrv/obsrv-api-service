import moment from "moment";
import * as _ from "lodash";
import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, } from "@aws-sdk/client-s3";
import { config as globalConfig } from "../../configs/Config";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getFileKey } from "../../utils/common"
import { FilterDataByDateRange, ICloudService } from "./types";
import { logger } from "@azure/storage-blob";
import { URLAccess } from "../../types/SampleURLModel";

export class AWSStorageService implements ICloudService {
    client: any;
    constructor(config: any) {
        if (_.get(config, "identity") && _.get(config, "credential") && _.get(config, "region")) {
            const region = _.get(config, "region").toString();
            this.client = new S3Client({ region });
        } else {
            const region = globalConfig.cloud_config.cloud_storage_region || "us-east-2";
            const s3Client = new S3Client({
                region,
            });
            this.client = s3Client;
        }
    }

    putAWSCommand(bucketName: string, fileToGet: string, prefix = "") {
        return new PutObjectCommand({ Bucket: bucketName, Key: prefix + fileToGet });
    }

    getAWSCommand(bucketName: string, fileToGet: string, prefix = "") {
        return new GetObjectCommand({ Bucket: bucketName, Key: prefix + fileToGet });
    }

    listAWSCommand(bucketName: string, prefix = "",) {
        return new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix, Delimiter: "/", });
    }

    generateSignedURLs(container: any, filesList: any, access: string = URLAccess.Read, urlExpiry?: number) {
        const AWSCommand = access === URLAccess.Read ? this.getAWSCommand : this.putAWSCommand
        const containerURLExpiry = urlExpiry ? urlExpiry : globalConfig.cloud_config.storage_url_expiry
        const signedURLs = filesList.map((fileNameWithPrefix: any) => {
            return new Promise((resolve) => {
                const generateSignedUrl = async () => {
                    const command = AWSCommand(container, fileNameWithPrefix);
                    const fileName = fileNameWithPrefix.split("/").pop();
                    const presignedURL = await getSignedUrl(this.client, command, { expiresIn: containerURLExpiry });
                    resolve({ [fileName]: presignedURL });
                }
                generateSignedUrl();
            });
        });
        return signedURLs
    }

    async getSignedUrls(container: any, filesList: any) {
        const signedUrlsPromises = this.generateSignedURLs(container, filesList)
        const signedUrlsList = await Promise.all(signedUrlsPromises);
        const periodWiseFiles: any = {};
        const files: any[] = [];
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
            expiresAt: moment().add(globalConfig.cloud_config.storage_url_expiry, 'seconds').toISOString(),
            files,
            periodWiseFiles,
        };
    }

    async getFiles(container: string, container_prefix: string, type: string, dateRange: string, datasetId: string) {
        const filesList = await this.filterDataByRange(container, container_prefix, type, dateRange, datasetId);
        const signedUrlsList = await this.getSignedUrls(container, filesList);
        return signedUrlsList;
    }

    async filterDataByRange(container: string, container_prefix: string, type: string, dateRange: any, datasetId: string): Promise<FilterDataByDateRange> {
        const startDate = moment(dateRange.from);
        const endDate = moment(dateRange.to);
        const result: any = [];
        const promises = [];
        for (let analysisDate = startDate; analysisDate <= endDate; analysisDate = analysisDate.add(1, "days")) {
            promises.push(new Promise((resolve) => {
                const pathPrefix = `${container_prefix}/${type}/${datasetId}/${analysisDate.format("YYYY-MM-DD")}`;
                try {
                    resolve(this.client.send(this.listAWSCommand(container, pathPrefix,)));
                }
                catch (err) { logger.error(err) }
            }))
        }
        const S3Objects = await Promise.all(promises);
        S3Objects.map((S3Object: any) => {
            S3Object.Contents?.map((content: any) => {
                result.push((content.Key || ""));
            })
        });
        return result;
    }
}