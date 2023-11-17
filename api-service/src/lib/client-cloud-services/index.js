/**
 * @file        - Entry file referencing Storage Service
 * @description - Entry file referencing Storage Service
 * @exports     - `AzureStorageService`, `AWSStorageService` and 'GCPStorageService`
 * @author      - RAJESH KUMARAVEL
 * @since       - 5.0.3
 * @version     - 1.0.0
 */

const AzureStorageService = require("./AzureStorageService");
const AWSStorageService = require("./AWSStorageService");
const GCPStorageService = require("./GCPStorageService");

/**
 * Based on Environment Cloud Provider value
 * Export respective Storage Service
 */

function init(provider) {
  switch (provider) {
    case "azure":
      return AzureStorageService;
      break;
    case "aws":
      return AWSStorageService;
      break;
    case "gcloud":
      return GCPStorageService;
      break;
    default:
      throw new Error(`Client Cloud Service - ${provider} provider is not supported`);
  }
}
module.exports = { init };
