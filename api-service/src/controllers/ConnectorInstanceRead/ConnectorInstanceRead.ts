import { Request, Response } from "express";
import httpStatus from "http-status";
import _ from "lodash";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { connectorInstance } from "../../services/ConnectorInstanceService";
import { obsrvError } from "../../types/ObsrvError";

const defaultFields = ["connector_id", "dataset_id", "status", "data_format", "operations_config", "connector_stats", "connector_state", "created_by", "updated_by", "created_date", "updated_date", "published_date"]

const validateRequest = (req: Request) => {
    const { id } = req.params;
    const fields = req.query.fields;
    if (fields && typeof fields !== 'string') {
        throw obsrvError(id, "CONNECTOR_INSTANCE_INVALID_FIELDS_VAL", `The specified fields [${fields}] in the query param is not a string.`, "BAD_REQUEST", 400);
    }
    const fieldValues = fields ? _.split(fields, ",") : [];
    const invalidFields = _.difference(fieldValues, defaultFields);
    if (!_.isEmpty(invalidFields)) {
        throw obsrvError(id, "CONNECTOR_INSTANCE_INVALID_FIELDS", `The specified fields [${invalidFields}] in the connector instance cannot be found.`, "BAD_REQUEST", 400);
    }
}

const connectorInstanceRead = async (req: Request, res: Response) => {
    validateRequest(req)
    const { id } = req.params;
    const { fields } = req.query;
    const attributes = !fields ? defaultFields : _.split(<string>fields, ",");
    const connectorInstanceValue = await connectorInstance.getConnectorInstance(id, attributes)
    if (!connectorInstanceValue) {
        throw obsrvError(id, "CONNECTOR_INSTANCE_NOT_FOUND", `Connector instance not found: ${id}`, "NOT_FOUND", 404);
    }
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: connectorInstanceValue });
}

export default connectorInstanceRead;