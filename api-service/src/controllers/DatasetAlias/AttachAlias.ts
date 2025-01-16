import { Request, Response } from "express";
import { schemaValidation } from "../../services/ValidationService";
import AttachAliasSchema from "./AttachAliasValidationSchema.json"
import { obsrvError } from "../../types/ObsrvError";
import _ from "lodash";
import { datasetService } from "../../services/DatasetService";
import { Op } from "sequelize";
import { Dataset } from "../../models/Dataset";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";


const validateRequest = async (req: Request) => {

    const isRequestValid: Record<string, any> = schemaValidation(req.body, AttachAliasSchema)
    if (!isRequestValid.isValid) {
        throw obsrvError("", "DATASET_ALIAS_INPUT_INVALID", isRequestValid.message, "BAD_REQUEST", 400)
    }

    const { dataset_id, alias_name: alias } = _.get(req, ["body", "request"])
    const dataset = await datasetService.getDataset(dataset_id, ["id", "name", "alias"], true);
    if (_.isEmpty(dataset)) {
        throw obsrvError(dataset_id, "DATASET_NOT_EXISTS", `Dataset does not exists with id:${dataset_id}`, "NOT_FOUND", 404);
    }

    if (_.get(dataset, "alias")) {
        throw obsrvError(dataset_id, "DATASET_ALIAS_EXISTS", `Dataset already has alias associated with it. Please detach the existing alias and try again`, "CONFLICT", 409);
    }

    const datasetList = await datasetService.findDatasets({ [Op.or]: [{ dataset_id: alias }, { name: alias }, { alias }] }, ["id"]);
    const draftDatasetList = await datasetService.findDraftDatasets({ [Op.or]: [{ dataset_id: alias }, { name: alias }] }, ["id"]);
    if (!(_.isEmpty(datasetList) && _.isEmpty(draftDatasetList))) {
        throw obsrvError(dataset_id, "DATASET_ALIAS_NOT_UNIQUE", `Dataset alias must be unique. The alias '${alias}' cannot be the same as the dataset id, dataset name or alias name of any other dataset.`, "CONFLICT", 409);
    }

}

const attachAlias = async (req: Request, res: Response) => {
    await validateRequest(req)
    const { dataset_id, alias_name } = _.get(req, ["body", "request"])
    await Dataset.update({ alias: alias_name }, { where: { id: dataset_id } });
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: `Dataset alias name attached successfully`, dataset_id } });
}

export default attachAlias;