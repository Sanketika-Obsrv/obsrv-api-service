export interface FilterDataByDateRange {
    container?: string,
    container_prefix: string,
    type: string,
    dateRange: any,
    datasetId: string
}

export interface ICloudService {
    getSignedUrls(container: string, filesList: any): any;
    getFiles(container: string, container_prefix: string, type: string, dateRange: string, datasetId: string): any;
    filterDataByRange(container: string, container_prefix: string, type: string, dateRange: string, datasetId: string): Promise<FilterDataByDateRange>;
}