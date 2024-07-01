import { config } from "../../configs/Config";
import * as _ from "lodash";
import { cloudProvider } from "../../services/CloudServices";
import { URLAccess } from "../../types/SampleURLModel";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const generatePreSignedUrl = async (access: string, files: any, containerType: string) => {
    const { filesList, updatedFileNames } = transformFileNames(files, access, containerType);
    const urlExpiry: number = getURLExpiry(access);
    const preSignedUrls = await Promise.all(cloudProvider.generateSignedURLs(config.cloud_config.container, updatedFileNames, access, urlExpiry));
    const signedUrlList = _.map(preSignedUrls, list => {
        const fileNameWithUid = _.keys(list)[0];
        return {
            filePath: getFilePath(fileNameWithUid, containerType),
            fileName: filesList.get(fileNameWithUid),
            preSignedUrl: _.values(list)[0]
        };
    });
    return signedUrlList;
}

const getFilePath = (file: string, containerType: string) => {
    const datasetUploadPath = `${config.presigned_url_configs.service}/user_uploads/${file}`;
    const connectorUploadPath = `${config.cloud_config.container_prefix}/${file}`;
    const paths: Record<string, string> = {
        "dataset": datasetUploadPath,
        "connector": connectorUploadPath
    };
    return paths[containerType] || datasetUploadPath;
}

const transformFileNames = (fileList: Array<string | any>, access: string, containerType: string): Record<string, any> => {
    if (access === URLAccess.Read) {
        return transformReadFiles(fileList, containerType);
    }
    return transformWriteFiles(fileList, containerType);
};

const transformReadFiles = (fileNames: Array<string | any>, containerType: string) => {
    const fileMap = new Map();
    const updatedFileNames = fileNames.map(file => {
        fileMap.set(file, file);
        return getFilePath(file, containerType);
    });
    return { filesList: fileMap, updatedFileNames };
};

const transformWriteFiles = (fileNames: Array<string | any>, containerType: string) => {
    const fileMap = new Map();
    const updatedFileNames = fileNames.map(file => {
        const uuid = uuidv4().replace(/-/g, "").slice(0, 6);
        const ext = path.extname(file);
        const baseName = path.basename(file, ext);
        const updatedFileName = `${baseName}_${uuid}${ext}`;
        fileMap.set(updatedFileName, file);
        return getFilePath(updatedFileName, containerType);
    });
    return { filesList: fileMap, updatedFileNames };
};

const getURLExpiry = (access: string) => {
    return access === URLAccess.Read ? config.presigned_url_configs.read_storage_url_expiry : config.presigned_url_configs.write_storage_url_expiry;
}
