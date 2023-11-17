/**
 * @file        - AWS Storage Service
 * @exports     - `AWSStorageService`
 * @since       - 5.0.1
 * @version     - 1.0.0
 * @implements  - BaseStorageService
 * @see {@link https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html | X-Amz-Credential}
 * @see {@link https://docs.aws.amazon.com/directconnect/latest/APIReference/CommonParameters.html#CommonParameters-X-Amz-Credential | X-Amz-Credential}
 */

const BaseStorageService = require("./BaseStorageService");
const { logger } = require("@project-sunbird/logger");
const _ = require("lodash");
const dateFormat = require("dateformat");
const uuidv1 = require("uuid/v1");
const async = require("async");
const storageLogger = require("./storageLogger");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand, ListObjectsV2Command, } = require("@aws-sdk/client-s3");
const { fromInstanceMetadata } = require("@aws-sdk/credential-providers");
const { Upload } = require("@aws-sdk/lib-storage");
const multiparty = require("multiparty");
const moment = require("moment");
const { config: globalConfig } = require("../../configs/Config");
const { getFileKey } = require("../../utils/common");

class AWSStorageService extends BaseStorageService {
  constructor(config) {
    super();
    if (_.get(config, "identity") && _.get(config, "credential") && _.get(config, "region")) {
      process.env.AWS_ACCESS_KEY_ID = _.get(config, "identity");
      process.env.AWS_SECRET_ACCESS_KEY = _.get(config, "credential");
      const region = _.get(config, "region").toString();
      this.client = new S3Client({ region });
    } else {
      const region = globalConfig.exhaust_config.exhaust_region || "us-east-2";
      process.env.AWS_REGION = region;
      const s3Client = new S3Client({
        region,
      });
      this.client = s3Client;
    }
  }

  /**
   * @description                     - Function to generate AWS command for an operation
   * @param  {string} bucketName      - AWS bucket name
   * @param  {string} fileToGet       - AWS File to fetch
   * @param  {string} prefix          - `Optional` - Prefix for file path
   * @returns                         - AWS Command to be executed by SDK
   */
  getAWSCommand(bucketName, fileToGet, prefix = "") {
    return new GetObjectCommand({ Bucket: bucketName, Key: prefix + fileToGet });
  }

  getAWSPutCommand(bucketName, fileToGet, prefix = "") {
    return new PutObjectCommand({ Bucket: bucketName, Key: prefix + fileToGet });
  }

  listAWSCommand(bucketName, prefix = "",) {
    return new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix, Delimiter: "/",});
  }

  /**
   * @description                     - Function to check whether file exists in specified bucket or not
   * @param  {string} bucketName      - AWS bucket name
   * @param  {string} fileToGet       - AWS File to check
   * @param  {string} prefix          - `Optional` - Prefix for file path
   * @param  {function} cb            - Callback function
   */
  async fileExists(bucketName, fileToGet, prefix = "", cb) {
    const params = { Bucket: bucketName, Key: prefix + fileToGet };
    const command = new HeadObjectCommand(params);
    logger.info({ msg: "AWS__StorageService - fileExists called for bucketName " + bucketName + " for file " + params.Key });
    await this.client
      .send(command)
      .then((resp) => {
        cb(null, resp);
      })
      .catch((err) => {
        cb(err);
      });
  }

  /**
   * @description                     - Provides a stream to read from a storage
   * @param {string} bucketName       - Bucket name or folder name in storage service
   * @param {string} fileToGet        - File path in storage service
   */
  fileReadStream(_bucketName = undefined, fileToGet = undefined) {
    return async (req, res, next) => {
      let bucketName = _bucketName;
      let fileToGet = req.params.slug.replace("__", "/") + "/" + req.params.filename;
      logger.info({ msg: "AWS__StorageService - fileReadStream called for bucketName " + bucketName + " for file " + fileToGet });

      if (fileToGet.includes(".json")) {
        const streamToString = (stream) =>
          new Promise((resolve, reject) => {
            const chunks = [];
            stream.on("data", (chunk) => chunks.push(chunk));
            stream.on("error", (err) => {
              reject(err);
            });
            stream.on("end", () => {
              resolve(Buffer.concat(chunks).toString("utf8"));
            });
          });
        await this.client
          .send(this.getAWSCommand(bucketName, fileToGet, undefined))
          .then((resp) => {
            streamToString(_.get(resp, "Body"))
              .then((data) => {
                res.end(data);
              })
              .catch((err) => {
                storageLogger.s500(res, "AWS__StorageService : readStream error - Error 500", err, "Failed to execute readStream");
              });
          })
          .catch((error) => {
            if (_.get(error, "$metadata.httpStatusCode") == 404) {
              storageLogger.s404(res, "AWS__StorageService : readStream client send error - Error with status code 404", error, "File not found");
            } else {
              storageLogger.s500(res, "AWS__StorageService : readStream client send error - Error 500", error, "Failed to display blob");
            }
          });
      } else {
        this.fileExists(bucketName, fileToGet, undefined, async (error, resp) => {
          if (_.get(error, "$metadata.httpStatusCode") == 404) {
            storageLogger.s404(res, "AWS__StorageService : fileExists error - Error with status code 404", error, "File does not exists");
          } else if (_.get(resp, "$metadata.httpStatusCode") == 200) {
            const command = this.getAWSCommand(bucketName, fileToGet, undefined);
            // `expiresIn` - The number of seconds before the presigned URL expires
            const presignedURL = await getSignedUrl(this.client, command, { expiresIn: 3600 });
            const response = {
              responseCode: "OK",
              params: {
                err: null,
                status: "success",
                errmsg: null,
              },
              result: {
                signedUrl: presignedURL,
              },
            };
            res.status(200).send(this.apiResponse(response));
          } else {
            storageLogger.s500(res, "AWS__StorageService : fileExists client send error - Error 500", "", "Failed to check file exists");
          }
        });
      }
    };
  }

  getFileProperties(_bucketName = undefined) {
    return (req, res, next) => {
      const bucketName = _bucketName;
      const fileToGet = JSON.parse(req.query.fileNames);
      logger.info({ msg: "AWS__StorageService - getFileProperties called for bucketName " + bucketName + " for file " + fileToGet });
      const responseData = {};
      if (Object.keys(fileToGet).length > 0) {
        const getBlogRequest = [];
        for (const [key, file] of Object.entries(fileToGet)) {
          const req = {
            bucketName: bucketName,
            file: file,
            reportname: key,
          };
          getBlogRequest.push(
            async.reflect((callback) => {
              this.getBlobProperties(req, callback);
            })
          );
        }
        async.parallel(getBlogRequest, (err, results) => {
          if (results) {
            results.map((blob) => {
              if (blob.error) {
                responseData[_.get(blob, "error.reportname")] = blob.error;
              } else {
                responseData[_.get(blob, "value.reportname")] = {
                  lastModified: _.get(blob, "value.lastModified"),
                  reportname: _.get(blob, "value.reportname"),
                  statusCode: _.get(blob, "value.statusCode"),
                  fileSize: _.get(blob, "value.contentLength"),
                };
              }
            });
            const finalResponse = {
              responseCode: "OK",
              params: {
                err: null,
                status: "success",
                errmsg: null,
              },
              result: responseData,
            };
            res.status(200).send(this.apiResponse(finalResponse));
          }
        });
      }
    };
  }

  async getBlobProperties(request, callback) {
    this.fileExists(request.bucketName, request.file, undefined, (error, resp) => {
      if (_.get(error, "$metadata.httpStatusCode") == 404) {
        logger.error({ msg: "AWS__StorageService : getBlobProperties_fileExists error - Error with status code 404. File does not exists - " + request.file, error: error });
        callback({ msg: _.get(error, "name"), statusCode: _.get(error, "$metadata.httpStatusCode"), filename: request.file, reportname: request.reportname });
      } else if (_.get(resp, "$metadata.httpStatusCode") == 200) {
        resp.reportname = request.reportname;
        resp.statusCode = 200;
        logger.info({
          msg: "AWS__StorageService : getBlobProperties_fileExists success with status code 200. File does exists - " + request.file,
          statusCode: _.get(error, "$metadata.httpStatusCode"),
        });
        callback(null, resp);
      } else {
        logger.error({ msg: "AWS__StorageService : getBlobProperties_fileExists client send error - Error 500 Failed to check file exists" });
        callback(true);
      }
    });
  }

  async getFileAsText(container = undefined, fileToGet = undefined, callback) {
    const bucketName = container;
    logger.info({ msg: "AWS__StorageService : getFileAsText called for bucket " + bucketName + " for file " + fileToGet });
    const streamToString = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", (err) => {
          reject(err);
        });
        stream.on("end", () => {
          resolve(Buffer.concat(chunks).toString("utf8"));
        });
      });
    await this.client
      .send(this.getAWSCommand(bucketName, fileToGet))
      .then((resp) => {
        streamToString(_.get(resp, "Body"))
          .then((data) => {
            callback(null, data);
          })
          .catch((err) => {
            logger.error({ msg: "AWS__StorageService : getFileAsText error - Error 500", err: "Failed to execute getFileAsText" });
            callback(err);
          });
      })
      .catch((error) => {
        if (_.get(error, "$metadata.httpStatusCode") == 404) {
          logger.error({ msg: "AWS__StorageService : getFileAsText client send error - Error with status code 404. File not found", error: error });
        } else {
          logger.error({ msg: "AWS__StorageService : getFileAsText client send error - Error 500. Failed to display blob", error: error });
        }
        callback(error);
      });
  }

  blockStreamUpload(uploadContainer = undefined) {
    return (req, res) => {
      try {
        const bucketName = uploadContainer;
        const blobFolderName = new Date().toLocaleDateString();
        let form = new multiparty.Form();
        form.on("part", async (part) => {
          if (part.filename) {
            let size = part.byteCount - part.byteOffset;
            let name = `${_.get(req, "query.deviceId")}_${Date.now()}.${_.get(part, "filename")}`;
            logger.info({
              msg: "AWS__StorageService : blockStreamUpload Uploading file to bucket " + uploadContainer + " to folder " + blobFolderName + " for file name " + name + " with size " + size,
            });
            let keyPath = uploadContainer + "/" + blobFolderName + "/" + name;
            logger.info({
              msg: "AWS__StorageService : blockStreamUpload Uploading file to " + keyPath,
            });
            try {
              const parallelUploads3 = new Upload({
                client: this.client,
                params: { Bucket: bucketName, Key: keyPath, Body: part },
                leavePartsOnError: false,
              });
              parallelUploads3.on("httpUploadProgress", (progress) => {
                let toStr;
                for (let key in progress) {
                  if (progress.hasOwnProperty(key)) {
                    toStr += `${key}: ${progress[key]}` + ", ";
                  }
                }
                logger.info({
                  msg: "AWS__StorageService : blockStreamUpload Uploading progress " + toStr,
                });
              });
              await parallelUploads3
                .done()
                .then((data) => {
                  const response = {
                    responseCode: "OK",
                    params: {
                      err: null,
                      status: "success",
                      errmsg: null,
                    },
                    result: {
                      message: "Successfully uploaded to blob",
                    },
                  };
                  return res.status(200).send(this.apiResponse(response, "api.desktop.upload.crash.log"));
                })
                .catch((err) => {
                  const response = {
                    responseCode: "SERVER_ERROR",
                    params: {
                      err: "SERVER_ERROR",
                      status: "failed",
                      errmsg: "Failed to upload to blob",
                    },
                    result: {},
                  };
                  logger.error({
                    msg: "AWS__StorageService : blockStreamUpload parallelUploads3 Failed to upload desktop crash logs to blob",
                    error: err,
                  });
                  return res.status(500).send(this.apiResponse(response, "api.desktop.upload.crash.log"));
                });
            } catch (e) {
              const response = {
                responseCode: "SERVER_ERROR",
                params: {
                  err: "SERVER_ERROR",
                  status: "failed",
                  errmsg: "Failed to upload to blob",
                },
                result: {},
              };
              logger.error({
                msg: "AWS__StorageService : blockStreamUpload try catch Failed to upload desktop crash logs to blob",
                error: e,
              });
              return res.status(500).send(this.apiResponse(response, "api.desktop.upload.crash.log"));
            }
          }
        });
        form.parse(req);
      } catch (error) {
        const response = {
          responseCode: "SERVER_ERROR",
          params: {
            err: "SERVER_ERROR",
            status: "failed",
            errmsg: "Failed to upload to blob",
          },
          result: {},
        };
        logger.error({
          msg: "AWS__StorageService : blockStreamUpload Failed to upload desktop crash logs to blob",
          error: error,
        });
        return res.status(500).send(this.apiResponse(response, "api.desktop.upload.crash.log"));
      }
    };
  }

  apiResponse({ responseCode, result, params: { err, errmsg, status } }, id = "api.report") {
    return {
      id: id,
      ver: "1.0",
      ts: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss:lo"),
      params: {
        resmsgid: uuidv1(),
        msgid: null,
        status: status,
        err: err,
        errmsg: errmsg,
      },
      responseCode: responseCode,
      result: result,
    };
  }

  async getPreSignedUrl(container, fileNames) {
    const presignedURLs = await Promise.all(
      fileNames.map(async (fileName) => {
        const command = this.getAWSPutCommand(container, fileName, undefined);
        const presignedURL = await getSignedUrl(this.client, command, { expiresIn: 3600 })
        return { fileName, presignedURL };
      })
    )
    return presignedURLs
  }

  /**
   * @description                     - Function to get file names S3 bucket for a specific date range
   * @param  {string} container       - Bucket name to fetch the files from
   * @param  {string} container_prefix - Prefix of the path if the files are nested
   * @param  {string} type            - Folder name/Type of data to fetch the files for
   * @param  {string} dateRange       - Range of time interval, to get the files for
   * @param  {string} datasetId       - Dataset Id to fetch the files for
   */
  async filterDataByRange(container, container_prefix, type, dateRange, datasetId) {
    let startDate = moment(dateRange.from);
    let endDate = moment(dateRange.to);
    let result = [];
    let promises = [];
    for (let analysisDate = startDate; analysisDate <= endDate; analysisDate = analysisDate.add(1, "days")) {
        promises.push(new Promise((resolve, reject) => {
          const pathPrefix = `${container_prefix}/${type}/${datasetId}/${analysisDate.format("YYYY-MM-DD")}`;
          try {
            resolve(this.client.send(this.listAWSCommand(container, pathPrefix,)));
          }
          catch (err) { console.log(err) }
        }))
    }
    let S3Objects = await Promise.all(promises);
    S3Objects.map((S3Object) => {
      S3Object.Contents?.map((content) => {
        result.push((content.Key || ""));
      })
    });
    return (result);
  }

  /**
   * @description                     - Function to get file download URLs from S3 bucket
   * @param  {string} container       - Bucket name to fetch the files from
   * @param  {Array} filesList         - List of file keys obtained for generating signed urls for download
   */
  async getFilesSignedUrls(container, filesList) {
    const signedUrlsPromises = filesList.map((fileNameWithPrefix) => {
      return new Promise(async (resolve, reject) => {
      const command = this.getAWSCommand(container, fileNameWithPrefix);
      const fileName = fileNameWithPrefix.split("/").pop();
      const presignedURL = await getSignedUrl(this.client, command, { expiresIn: globalConfig.exhaust_config.storage_url_expiry, });
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
        if(_.has(periodWiseFiles, period)) 
            periodWiseFiles[period].push(fileUrl);
        else {
            periodWiseFiles[period] = [];
            periodWiseFiles[period].push(fileUrl);
        }
        files.push(fileUrl);
    });
    return { 
        expiresAt: moment().add(globalConfig.exhaust_config.storage_url_expiry, 'seconds').toISOString(), 
        files, 
        periodWiseFiles,
    };
  }

  /**
   * @description                     - Function to get file names S3 bucket for a specific date range
   * @param  {string} container       - Bucket name to fetch the files from
   * @param  {string} container_prefix - Prefix of the path if the files are nested
   * @param  {string} type            - Folder name/Type of data to fetch the files for
   * @param  {string} dateRange       - Range of time interval, to get the files for
   * @param  {string} datasetId       - Dataset Id to fetch the files for
   */
  async getFiles(container, container_prefix, type, dateRange, datasetId) {
    const filesList = await this.filterDataByRange(container, container_prefix, type, dateRange, datasetId);
    const signedUrlsList = await this.getFilesSignedUrls(container, filesList);
    return signedUrlsList;
  }
}

module.exports = AWSStorageService;
