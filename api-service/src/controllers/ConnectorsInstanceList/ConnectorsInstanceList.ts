import _ from "lodash";
import httpStatus from "http-status";
import { Request, Response } from "express";
import logger from "../../logger";
import { schemaValidation } from "../../services/ValidationService";
import ConnectorInstanceList from "./ConnectorInstanceListValidationSchema.json";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { obsrvError } from "../../types/ObsrvError";
import { connectorInstance } from "../../services/ConnectorInstanceService";

const liveConnectorInstanceStatus = ["Live", "Retired", "Purged"]
const draftConnectorInstanceStatus = ["Draft", "ReadyToPublish"]
const defaultFields = ["id", "dataset_id", "connector_id", "data_format", "connector_config", "operations_config", "status", "connector_state", "connector_stats", "created_by", "updated_by", "created_date", "updated_date", "published_date"]
const connectorInstanceList = async (req: Request, res: Response) => {
    
    const isRequestValid: Record<string, any> = schemaValidation(req.body, ConnectorInstanceList)
    if (!isRequestValid.isValid) {
        throw obsrvError("", "CONNECTOR_INSTANCE_LIST_INPUT_INVALID", isRequestValid.message, "BAD_REQUEST", 400)
    }

    const connectorInstanceBody = req.body.request;
    const connectorInstanceList = await listDatasets(connectorInstanceBody)
    const responseData = { data: connectorInstanceList, count: _.size(connectorInstanceList) }
    logger.info({req: req.body, resmsgid: _.get(res, "resmsgid"), message: `Connector Instances are listed successfully with a count (${_.size(connectorInstanceList)})` })
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: responseData });
    
}

const listDatasets = async (request: Record<string, any>): Promise<Record<string, any>> => {

    const { filters = {} } = request || {};
    const connectorInstanceStatus = _.get(filters, "status");
    const status = _.isArray(connectorInstanceStatus) ? connectorInstanceStatus : _.compact([connectorInstanceStatus])
    const draftFilters = _.set(_.cloneDeep(filters), "status", _.isEmpty(status) ? draftConnectorInstanceStatus : _.intersection(status, draftConnectorInstanceStatus));
    const liveFilters = _.set(_.cloneDeep(filters), "status", _.isEmpty(status) ? liveConnectorInstanceStatus : _.intersection(status, liveConnectorInstanceStatus));
    const liveDatasetList = await connectorInstance.findConnectorInstance(liveFilters, defaultFields, [["updated_date", "DESC"]]);
    const draftDatasetList = await connectorInstance.findConnectorInstance(draftFilters, defaultFields, [["updated_date", "DESC"]]);
    return _.compact(_.concat(liveDatasetList, draftDatasetList));
}
