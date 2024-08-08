import { Request, Response } from "express";
import _ from "lodash";
import { connectorInstance } from "../../services/ConnectorInstanceService";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";

const connectorInstanceDelete = async (req: Request, res: Response) => {
    const id = _.get(req, "params.id");

    const deleteResponse = await connectorInstance.deleteConnectorInstance(id);
    if (deleteResponse === 0) {
        logger.error({ id, message: `Connector Instance with ${id} does not exists`, code: "CONNECTOR_INSTANCE_NOT_EXISTS" })
        return ResponseHandler.errorResponse({ message: `Connector Instance with ${id} does not exists`, statusCode: 404, errCode: "NOT_FOUND", code: "CONNECTOR_INSTANCE_NOT_EXISTS" }, req, res);
    }

    logger.info({ id, message: `connector instances with ${id} deleted successfully` })
    return ResponseHandler.successResponse(req, res, { status: 200, data: { message: `Connector_Instance with ${id} deleted successfully` } });
}

export default connectorInstanceDelete;