import { Request, Response } from "express";
import { datasetService } from "../../services/DatasetService";
import { obsrvError } from "../../types/ObsrvError";
import { Dataset } from "../../models/Dataset";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import _ from "lodash";

const validateDataset = async (dataset_id: string) => {
    const dataset = await datasetService.getDataset(dataset_id, ["alias"], true);
    if (!dataset) {
        throw obsrvError(dataset_id, "DATASET_NOT_FOUND", `Dataset with the given dataset_id:${dataset_id} not found`, "NOT_FOUND", 404);
    }
    if (!_.get(dataset, "alias")) {
        throw obsrvError(dataset_id, "DATASET_ALIAS_NOT_EXISTS", `Dataset does not have any alias associated with it`, "NOT_FOUND", 404);
    }
    return _.get(dataset, "alias")
}

const detachAlias = async (req: Request, res: Response) => {
    const dataset_id = req.params.dataset_id
    const alias_name=await validateDataset(dataset_id);
    await Dataset.update({ alias: null }, { where: { id: dataset_id } });
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: `Dataset alias name '${alias_name}' detached successfully`, dataset_id } });
}

export default detachAlias;