import { Request, Response } from "express";
import { obsrvError } from "../../types/ObsrvError";
import * as _ from "lodash";
import { datasetService } from "../../services/DatasetService";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import { DatasetStatus } from "../../types/DatasetModels";
import { tableGenerator } from "../../services/TableGenerator";

const defaultAttributes = ["data_schema", "denorm_config", "transformations_config"]
const defaultLiveAttributes = ["data_schema", "denorm_config"]

const generateFields = async (req: Request, res: Response) => {
    const { status } = req.query;
    const { dataset_id } = req.params;
    const dataset = (status === DatasetStatus.Draft) ? await datasetService.getDraftDataset(dataset_id, defaultAttributes) : await datasetService.getDataset(dataset_id, defaultLiveAttributes, true);
    let flattenResult: any = [];
    if (!dataset) {
        throw obsrvError(dataset_id, "DATASET_NOT_FOUND", `Dataset with the given dataset_id:${dataset_id} not found`, "NOT_FOUND", 404);
    }
    const data_schema = _.get(dataset, "data_schema");
    const denorm_config = _.get(dataset, "denorm_config", []);

    if (status === DatasetStatus.Draft) {
        const transformations_config = _.get(dataset, "transformations_config", [])
        const fields = await tableGenerator.getAllFields({ data_schema, denorm_config, transformations_config }, "druid")
        flattenResult.push(...fields)
    }
    else {
        const transformations = await datasetService.getTransformations(dataset_id, ["id", "dataset_id", "transformation_function", "field_key"])
        const transformations_config = _.map(transformations, (transformation: any) => {
            return {
                "field_key": transformation?.field_key,
                "transformation_function": transformation?.transformation_function,
            }
        })
        const fields = await tableGenerator.getAllFields({ data_schema, denorm_config, transformations_config }, "druid")
        flattenResult.push(...fields)
    }

    const data = _.filter(flattenResult, (field: any) => {
        return field?.name !== "obsrv_meta.syncts"
    })
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: data });
}

export default generateFields;