import _ from "lodash";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { schemaValidation } from "../../services/ValidationService";
import ConnectorInstanceList from "./ConnectorInstanceListValidationSchema.json";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { obsrvError } from "../../types/ObsrvError";
import { connectorInstance } from "../../services/ConnectorInstanceService";

const defaultFields = ["dataset_id", "connector_id", "data_format", "operations_config", "status", "connector_state", "connector_stats", "created_by", "updated_by", "created_date", "updated_date", "published_date"]

const validateRequest = (req: Request) => {
    const isRequestValid: Record<string, any> = schemaValidation(req.body, ConnectorInstanceList)
    if (!isRequestValid.isValid) {
        throw obsrvError("", "CONNECTORS_INSTANCE_LIST_INPUT_INVALID", isRequestValid.message, "BAD_REQUEST", 400)
    }
}

const connectorInstanceList = async (req: Request, res: Response) => {
    validateRequest(req);
    const connectorInstanceBody = _.get(req, ["body","request"]);
    const connectorInstanceList = await listConnectorInstances(connectorInstanceBody)
    const responseData = { data: connectorInstanceList, count: _.size(connectorInstanceList) }
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: responseData });
}

const listConnectorInstances = async (request: Record<string, any>): Promise<Record<string, any>> => {
    const { filters = {} } = request || {};
    const status = _.get(filters, "status");
    const data_format = _.get(filters, "data_format");
    const filterOptions: any = {};
    if (!_.isEmpty(status)) filterOptions["status"] = status;
    if (!_.isEmpty(data_format)) filterOptions["data_format"] = data_format;
    return connectorInstance.getConnectorInstances(filterOptions, defaultFields);

}

export default connectorInstanceList;