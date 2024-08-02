import { Request, Response } from "express";
import { obsrvError } from "../../types/ObsrvError";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import { connectorService } from "../../services/ConnectorService";
import _ from "lodash";

const defaultFields = ["id", "connector_id", "name", "type", "category", "version", "description", "licence", "owner", "iconurl", "status", "ui_spec", "created_by", "updated_by", "created_date", "updated_date", "live_date"];

const connectorsRead = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { mode } = req.query;
    const isEditMode = _.toLower(_.toString(mode)) === "edit"
    const status = isEditMode ? "Draft" : "Live"
    const connector = await connectorService.getConnector({ id, status }, defaultFields)
    if (!connector) {
        throw obsrvError("", "CONNECTOR_NOT_FOUND", `Connector not found: ${id}`, "NOT_FOUND", 404);
    }
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: connector });
}

export default connectorsRead;