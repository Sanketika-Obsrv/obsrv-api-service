export interface FilterDataByDateRange {
    container?: string,
    container_prefix: string,
    type: string,
    dateRange: any,
    datasetId: string
}

interface getFileAsTextCallback {
    (err: any, data: any, fileName?: string): any;
}

export interface ICloudService {
    getSignedUrls(container: string, filesList: any): any;
    getFiles(container: string, container_prefix: string, type: string, dateRange: string, datasetId: string): any;
    filterDataByRange(container: string, container_prefix: string, type: string, dateRange: string, datasetId: string): Promise<FilterDataByDateRange>;
    uploadFileToBucket(bucketName: string, fileToPut: string, prefix: string, data: any, callback: getFileAsTextCallback): any;
    fileExists(bucketName: string, fileToGet: string, prefix: string, callback: getFileAsTextCallback): any;
}