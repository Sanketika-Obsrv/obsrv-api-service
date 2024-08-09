import { Request, Response } from "express";
import _ from "lodash";
import { connectorInstance } from "../../services/ConnectorInstanceService";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { obsrvError } from "../../types/ObsrvError";

const connectorInstanceDelete = async (req: Request, res: Response) => {
    const id = _.get(req, "params.id");

    const connectorInstanceStatus = connectorInstance.getConnectorInstanceStatus(id)
    if (!_.includes(["Draft", "ReadyToPublish"], await connectorInstanceStatus)) {
        throw obsrvError(id, "CONNECTOR_INSTANCE_NOT_IN_DRAFT_STATE_TO_DELETE", "Connector Instance cannot be deleted as it is not in draft state", "BAD_REQUEST", 400)
    }
    const deleteResponse = await connectorInstance.deleteConnectorInstance(id);
    if (deleteResponse === 0) {
        logger.error({ id, message: `Connector Instance with ${id} does not exists`, code: "CONNECTOR_INSTANCE_NOT_EXISTS" })
        return ResponseHandler.errorResponse({ message: `Connector Instance with ${id} does not exists`, statusCode: 404, errCode: "NOT_FOUND", code: "CONNECTOR_INSTANCE_NOT_EXISTS" }, req, res);
    }

    logger.info({ id, message: `connector instance with ${id} deleted successfully` })
    return ResponseHandler.successResponse(req, res, { status: 200, data: { message: `Connector_Instance deleted successfully`, id: `${id}` } });
}

export default connectorInstanceDelete;