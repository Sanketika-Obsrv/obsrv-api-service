import { Request, Response } from "express";
import { schemaValidation } from "../../services/ValidationService";
import DatasetAliasSchema from "./DatasetAliasValidationSchema.json"
import { obsrvError } from "../../types/ObsrvError";
import _ from "lodash";
import { datasetService } from "../../services/DatasetService";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";


const validateRequest = async (req: Request) => {

    const isRequestValid: Record<string, any> = schemaValidation(req.body, DatasetAliasSchema)
    if (!isRequestValid.isValid) {
        throw obsrvError("", "DATASET_ALIAS_INPUT_INVALID", isRequestValid.message, "BAD_REQUEST", 400)
    }

    const { dataset_id, alias_name: alias, table_name } = _.get(req, ["body", "request"])
    const nameRegex = /^[a-z0-9.-]+$/;
    if (!nameRegex.test(alias)) {
        throw obsrvError("", "ALIAS_NAME_INVALID", `Alias name must only contain lowercase letters, numbers, periods, and dashes.`, "BAD_REQUEST", 400);
    }

    const dataset = await datasetService.getDataset(dataset_id, ["id", "name"], true);
    if (_.isEmpty(dataset)) {
        throw obsrvError(dataset_id, "DATASET_NOT_EXISTS", `Dataset does not exists with id:${dataset_id}`, "NOT_FOUND", 404);
    }
    if (table_name) {
        const tableRecord = await datasetService.getDatasource(table_name, ["id", "datasource"]);
        if (_.isEmpty(tableRecord)) {
            throw obsrvError("", "TABLE_NOT_EXISTS", `Table does not exists with name:${table_name}`, "NOT_FOUND", 404);
        }
        if (_.isEmpty(_.get(tableRecord, "datasource"))) {
            throw obsrvError(dataset_id, "ALIAS_NOT_EXISTS", `Alias name for dataset ${dataset_id} does not exists`, "BAD_REQUEST", 400);
        }
        const datasourceRecords = await datasetService.findDatasources({ datasource: alias }, ["datasource_ref"])
        if (!_.isEmpty(datasourceRecords)) {
            throw obsrvError(dataset_id, "ALIAS_NOT_UNIQUE", `Alias name '${alias}' already exists`, "BAD_REQUEST", 400);
        }
    }

}

const datasetAlias = async (req: Request, res: Response) => {
    await validateRequest(req)
    const { dataset_id, alias_name, table_name } = _.get(req, ["body", "request"])
    const userID = (req as any)?.userID;
    if (table_name) {
        await datasetService.updateDatasource({ datasource: alias_name, updated_by: userID }, { id: table_name });
    }
    else {
        await datasetService.updateDatasource({ datasource: alias_name, updated_by: userID }, { dataset_id, is_primary: true });
    }
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: `Dataset alias name '${alias_name}' updated successfully`, dataset_id } });
}

export default datasetAlias;