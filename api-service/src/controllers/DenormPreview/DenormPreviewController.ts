import { Request, Response } from "express";
import httpStatus from "http-status";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { denormPreviewService } from "../../services/DenormPreviewService";

export const apiId = "api.datasets.denorm-preview";
export const errorCode = "DENORM_PREVIEW_FAILURE"

const denormPreview = async (req: Request, res: Response) => {
    const { dataset_id } = req.params;
    const { mode } = req.query;
    const event = await denormPreviewService.getDenormPreviewEvent(dataset_id, mode as string);
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: event });
}

export default denormPreview;
