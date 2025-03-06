import { Request, Response } from "express";
import httpStatus from "http-status";
import _ from "lodash";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { DatasetDraft } from "../../models/DatasetDraft";
import { datasetService, getUpdatedV2ConnectorsPayload } from "../../services/DatasetService";
import { obsrvError } from "../../types/ObsrvError";
import { cipherService } from "../../services/CipherService";
import { Dataset } from "../../models/Dataset";
import { Datasource } from "../../models/Datasource";
import { userService } from "../../services/UserService";
import { config } from "../../configs/Config";

export const apiId = "api.datasets.read";
export const errorCode = "DATASET_READ_FAILURE"

// TODO: Move this to a config
export const defaultFields = ["dataset_id", "name", "type", "status", "tags", "version", "api_version", "dataset_config"]

const validateRequest = (req: Request) => {

    const { dataset_id } = req.params;
    const { fields, mode } = req.query;
    const fieldValues = fields ? _.split(fields as string, ",") : [];
    const invalidFields = mode === "edit" ? _.difference(fieldValues, Object.keys(DatasetDraft.getAttributes())) : _.difference(fieldValues, Object.keys(Dataset.getAttributes()));
    if (!_.isEmpty(invalidFields)) {
        throw obsrvError(dataset_id, "DATASET_INVALID_FIELDS", `The specified fields [${invalidFields}] in the dataset cannot be found.`, "BAD_REQUEST", 400);
    }

}

const datasetRead = async (req: Request, res: Response) => {

    validateRequest(req);
    const { dataset_id } = req.params;
    const { fields, mode } = req.query;
    const userID = (req as any)?.userID;
    const attributes = !fields ? defaultFields : _.split(<string>fields, ",");
    const dataset = (mode == "edit") ? await readDraftDataset(dataset_id, attributes, userID) : await readDataset(dataset_id, attributes)
    if (!dataset) {
        throw obsrvError(dataset_id, "DATASET_NOT_FOUND", `Dataset with the given dataset_id:${dataset_id} not found`, "NOT_FOUND", 404);
    }
    if (!_.isEmpty(dataset.connectors_config)) {
        dataset.connectors_config = processConnectorsConfig(dataset.connectors_config);
    }
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: dataset });
}

const readDraftDataset = async (datasetId: string, attributes: string[], userID: string): Promise<any> => {

    const attrs = _.union(attributes, ["dataset_config", "api_version", "type", "id"])
    const draftDataset = await datasetService.getDraftDataset(datasetId, attrs);
    if (draftDataset) { // Contains a draft
        const apiVersion = _.get(draftDataset, ["api_version"]);
        const dataset: any = (apiVersion === "v2") ? draftDataset : await datasetService.migrateDraftDataset(datasetId, draftDataset, userID)
        return _.pick(dataset, attributes);
    }

    const liveDataset = await datasetService.getDataset(datasetId, undefined, true);
    if (liveDataset) {
        if (_.lowerCase(config.is_RBAC_enabled) !== "false") {
            const user = await userService.getUser({ id: userID }, ["roles", "user_name"]);
            const userRoles = _.get(user, "roles");
            const hasValidRole = _.some(userRoles, (role: string) => ['dataset_manager', 'admin'].includes(role));
            if (!hasValidRole) {
                throw obsrvError(datasetId, "UNAUTHORIZED_ACCESS", "Access denied. User does not have permission to perform this action", "FORBIDDEN", 403);
            }
        }
        const dataset = await datasetService.createDraftDatasetFromLive(liveDataset, userID)
        return _.pick(dataset, attributes);
    }

    return null;
}

const readDataset = async (datasetId: string, attributes: string[]): Promise<any> => {
    const attrs = _.union(attributes, ["api_version"])
    const dataset = await datasetService.getDataset(datasetId, attrs, true);
    if (!dataset) {
        return;
    }
    const api_version = _.get(dataset, "api_version")
    const datasetConfigs: any = {}
    const transformations_config = await datasetService.getTransformations(datasetId, ["field_key", "transformation_function", "mode", "metadata"])
    const datasourceConfig = await Datasource.findOne({ where: { dataset_id: datasetId, is_primary: true }, attributes: ["datasource"], raw: true })
    datasetConfigs["alias"] = _.get(datasourceConfig, "datasource")
    if (api_version !== "v2") {
        datasetConfigs["transformations_config"] = _.map(transformations_config, (config) => {
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
        datasetConfigs["connectors_config"] = []
    }
    else {
        const v2connectors = await datasetService.getConnectors(datasetId, ["id", "connector_id", "connector_config", "operations_config"]);
        const updatedConnectorsPayload = getUpdatedV2ConnectorsPayload(v2connectors)
        datasetConfigs["connectors_config"] = updatedConnectorsPayload
        datasetConfigs["transformations_config"] = transformations_config;
    }
    return { ...dataset, ...datasetConfigs };
}

const processConnectorsConfig = (connectorsConfig: any) => {
    return connectorsConfig.map((connector: any) => {
        let connector_config = _.get(connector, "connector_config");
        const authMechanism = _.get(connector_config, ["authenticationMechanism"]);

        if (authMechanism && authMechanism.encrypted) {
            connector_config = {
                ...connector_config,
                authenticationMechanism: JSON.parse(cipherService.decrypt(authMechanism.encryptedValues))
            };
        }

        return {
            ...connector,
            connector_config: _.isObject(connector_config) ? connector_config : JSON.parse(cipherService.decrypt(connector_config))
        };
    });
}

export default datasetRead;