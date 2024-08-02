import { Request, Response } from "express";
import ConnectorListSchema from "./ConnectorsListValidationSchema.json";
import { obsrvError } from "../../types/ObsrvError";
import { schemaValidation } from "../../services/ValidationService";
import _ from "lodash";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import { connectorService } from "../../services/ConnectorService";

const defaultFields = ["id", "connector_id", "name", "type", "category", "version", "description", "technology", "runtime", "licence", "owner", "iconurl", "status", "created_by", "updated_by", "created_date", "updated_date", "live_date"];

const validateRequest = (req: Request) => {
    const isRequestValid: Record<string, any> = schemaValidation(req.body, ConnectorListSchema)
    if (!isRequestValid.isValid) {
        throw obsrvError("", "CONNECTORS_LIST_INPUT_INVALID", isRequestValid.message, "BAD_REQUEST", 400)
    }
}

const connectorsList = async (req: Request, res: Response) => {
    validateRequest(req);
    const connectorBody = _.get(req, ["body", "request"]);
    const connectorList = await listConnectors(connectorBody)
    const responseData = { data: connectorList, count: _.size(connectorList) }
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: responseData });
}

const listConnectors = async (request: Record<string, any>): Promise<Record<string, any>> => {
    const { filters = {} } = request || {};
    const status = _.get(filters, "status");
    const category = _.get(filters, "category");
    const filterOptions: any = {};
    if (!_.isEmpty(status))  filterOptions["status"] = status;
    if (!_.isEmpty(category)) filterOptions["category"] = category;
    return connectorService.findConnectors(filterOptions, defaultFields);
    
}

export default connectorsList;