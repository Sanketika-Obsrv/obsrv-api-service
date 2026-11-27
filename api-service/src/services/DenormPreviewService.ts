import _ from "lodash";
import { Op } from "sequelize";
import { datasetService } from "./DatasetService";
import { flattenEvent } from "../utils/flattenEvent";
import { obsrvError } from "../types/ObsrvError";

class DenormPreviewService {

    getDenormPreviewEvent = async (datasetId: string, mode?: string): Promise<{ event: Record<string, any>; unavailable_denorm_fields: string[] }> => {

        const dataset = (mode === "edit")
            ? await datasetService.getDraftDataset(datasetId, ["sample_data", "denorm_config"])
            : await datasetService.getDataset(datasetId, ["sample_data", "denorm_config"], true);

        if (!dataset) {
            throw obsrvError(datasetId, "DATASET_NOT_FOUND", `Dataset with the given dataset_id:${datasetId} not found`, "NOT_FOUND", 404);
        }

        const baseEvent = flattenEvent(_.get(dataset, "sample_data.mergedEvent") || {});
        const denormFields: Array<Record<string, any>> = _.get(dataset, "denorm_config.denorm_fields") || [];

        if (_.isEmpty(denormFields)) {
            return { event: baseEvent, unavailable_denorm_fields: [] };
        }

        const masterIds = _.uniq(_.map(denormFields, (field) => _.get(field, "dataset_id")));
        const masters = await datasetService.findDatasets(
            { dataset_id: { [Op.in]: masterIds }, type: "master" },
            ["dataset_id", "sample_data"]
        );
        const mastersById = _.keyBy(masters, "dataset_id");

        const mergedEvent: Record<string, any> = { ...baseEvent };
        const unavailableDenormFields: string[] = [];
        for (const field of denormFields) {
            const outField = _.get(field, "denorm_out_field");
            if (!outField) {
                continue;
            }
            const master = mastersById[_.get(field, "dataset_id")];
            const masterEvent = _.get(master, "sample_data.mergedEvent");
            // Missing, not live, or no sample_data: report it so the console can say what PII detection didn't cover.
            if (_.isEmpty(masterEvent)) {
                unavailableDenormFields.push(outField);
                continue;
            }
            const flattenedMasterEvent = flattenEvent(masterEvent);
            for (const key in flattenedMasterEvent) {
                mergedEvent[`${outField}.${key}`] = flattenedMasterEvent[key];
            }
        }

        return { event: mergedEvent, unavailable_denorm_fields: _.uniq(unavailableDenormFields) };
    }
}

export const denormPreviewService = new DenormPreviewService();
