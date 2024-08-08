import _ from "lodash";
import { Request, Response } from "express";
import httpStatus from "http-status";
import { schemaValidation } from "../../services/ValidationService";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import ConnectorInstanceCreate from "./ConnectorInstanceCreateValidationSchema.json";
import { obsrvError } from "../../types/ObsrvError";
import { connectorInstance } from "../../services/ConnectorInstanceService";

const validateRequest = async (req: Request) => {

    const isRequestValid: Record<string, any> = schemaValidation(req.body, ConnectorInstanceCreate)
    if (!isRequestValid.isValid) {
        throw obsrvError("", "CONNECTOR_INSTANCE_INVALID_INPUT", isRequestValid.message, "BAD_REQUEST", 400)
    }

    const connectorInstanceId = _.get(req, ["body", "request", "id"])
    const isConnectorInstanceIdExists = await connectorInstance.checkConnectorInstanceExists(connectorInstanceId);
    if (!_.isEmpty(isConnectorInstanceIdExists)) {
        throw obsrvError(connectorInstanceId, "CONNECTOR_INSTANCE_EXISTS", `ConnectorInstance Already exists with id:${connectorInstanceId}`, "CONFLICT", 409)
    }
}

const connectorInstanceCreate = async (req: Request, res: Response) => {
    const dataset_id = _.get(req, ["body", "request", "dataset_id"]);
    const connector_id = _.get(req, ["body", "request", "connector_id"]);
    const id = `${connector_id}.${dataset_id}`;
    _.set(req, ["body", "request", "id"], id)
    await validateRequest(req)
    const createResponse = await connectorInstance.createConnectorInstance(req.body.request)
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: createResponse });
}

export default connectorInstanceCreate;