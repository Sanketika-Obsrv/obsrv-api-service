import { Request, Response } from "express";
import httpStatus from "http-status";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { denormPreviewService } from "../../services/DenormPreviewService";
import { obsrvError } from "../../types/ObsrvError";

export const apiId = "api.datasets.denorm-preview";
export const errorCode = "DENORM_PREVIEW_FAILURE"

const allowedModes = ["edit"];

const denormPreview = async (req: Request, res: Response) => {
    const { dataset_id } = req.params;
    const { mode } = req.query;
    // req.query.mode can be an array if the client repeats the query key; only a known string mode is valid
    if (mode !== undefined && (typeof mode !== "string" || !allowedModes.includes(mode))) {
        throw obsrvError(dataset_id, "DENORM_PREVIEW_INVALID_MODE", "The specified mode is invalid", "BAD_REQUEST", 400);
    }
    const event = await denormPreviewService.getDenormPreviewEvent(dataset_id, mode);
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: event });
}

export default denormPreview;
