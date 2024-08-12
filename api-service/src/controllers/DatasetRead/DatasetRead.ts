import { Request, Response } from "express";
import httpStatus from "http-status";
import _ from "lodash";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { DatasetDraft } from "../../models/DatasetDraft";
import { datasetService } from "../../services/DatasetService";
import { obsrvError } from "../../types/ObsrvError";
import { cipherService } from "../../services/CipherService";

export const apiId = "api.datasets.read";
export const errorCode = "DATASET_READ_FAILURE"

// TODO: Move this to a config
const defaultFields = ["dataset_id", "name", "type", "status", "tags", "version", "api_version", "dataset_config"]

const validateRequest = (req: Request) => {

    const { dataset_id } = req.params;
    const fields = req.query.fields;
    if (fields && typeof fields !== 'string') {
        throw obsrvError(dataset_id, "DATASET_INVALID_FIELDS_VAL", `The specified fields [${fields}] in the query param is not a string.`, "BAD_REQUEST", 400);
    }
    const fieldValues = fields ? _.split(fields, ",") : [];
    const invalidFields = _.difference(fieldValues, Object.keys(DatasetDraft.getAttributes()));
    if (!_.isEmpty(invalidFields)) {
        throw obsrvError(dataset_id, "DATASET_INVALID_FIELDS", `The specified fields [${invalidFields}] in the dataset cannot be found.`, "BAD_REQUEST", 400);
    }

}

const datasetRead = async (req: Request, res: Response) => {

    validateRequest(req);
    const { dataset_id } = req.params;
    const { fields, mode } = req.query;
    const attributes = !fields ? defaultFields : _.split(<string>fields, ",");
    const dataset = (mode == "edit") ? await readDraftDataset(dataset_id, attributes) : await readDataset(dataset_id, attributes)
    if (!dataset) {
        throw obsrvError(dataset_id, "DATASET_NOT_FOUND", `Dataset with the given dataset_id:${dataset_id} not found`, "NOT_FOUND", 404);
    }
    if (dataset.connectors_config) {
        dataset.connectors_config = dataset?.connectors_config.map((connector: any) => {
            const connector_config = _.get(connector, "connector_config")
            return {
                ...connector,
                connector_config: _.isObject(connector_config) ? connector_config : JSON.parse(cipherService.decrypt(connector.connector_config))
            }
        });
    }
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: dataset });
}

const readDraftDataset = async (datasetId: string, attributes: string[]): Promise<any> => {

    const attrs = _.union(attributes, ["dataset_config", "api_version", "type", "id"])
    const draftDataset = await datasetService.getDraftDataset(datasetId, attrs);
    if (draftDataset) { // Contains a draft
        const apiVersion = _.get(draftDataset, ["api_version"]);
        const dataset: any = (apiVersion === "v2") ? draftDataset : await datasetService.migrateDraftDataset(datasetId, draftDataset)
        return _.pick(dataset, attributes);
    }

    const liveDataset = await datasetService.getDataset(datasetId, undefined, true);
    if (liveDataset) {
        const dataset = await datasetService.createDraftDatasetFromLive(liveDataset)
        return _.pick(dataset, attributes);
    }

    return null;
}

const readDataset = async (datasetId: string, attributes: string[]): Promise<any> => {
    const dataset = await datasetService.getDataset(datasetId, attributes, true);
    const api_version = _.get(dataset, "api_version")
    let datasetConfigs: any = {}
    const connectors_config: any[] = await datasetService.getConnectorsV1(datasetId, ["id", "dataset_id", "connector_config", "connector_type"]);
    const transformations_config = await datasetService.getTransformations(datasetId, ["field_key", "transformation_function", "mode", "metadata"])
    if (api_version !== "v2") {
        datasetConfigs["connectors_config"] = _.map(connectors_config, (config) => {
            return {
                id: _.get(config, "id"),
                connector_id: _.get(config, "connector_type"),
                connector_config: _.get(config, "connector_config"),
                version: "v1"
            }
        })
        datasetConfigs["transformations_config"] = _.map(transformations_config, (config) => {
            console.log(config)
            const section: any = _.get(config, "metadata.section") || _.get(config, "transformation_function.category");
            return {
                field_key: _.get(config, "field_key"),
                transformation_function: {
                    ..._.get(config, ["transformation_function"]),
                    datatype: _.get(config, "metadata._transformedFieldDataType") || _.get(config, "transformation_function.datatype") || "string",
                    category: datasetService.getTransformationCategory(section),
                },
                mode: _.get(config, "mode")
            }
        })
    }
    else {
        datasetConfigs["connectors_config"] = connectors_config;
        datasetConfigs["transformations_config"] = transformations_config;
    }
    return { ...dataset, ...datasetConfigs };
}

export default datasetRead;