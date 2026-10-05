import _ from "lodash";
import { Op } from "sequelize";
import { datasetService } from "./DatasetService";
import { flattenEvent } from "../utils/flattenEvent";

class DenormPreviewService {

    getDenormPreviewEvent = async (datasetId: string, mode?: string): Promise<Record<string, any>> => {

        const dataset = (mode === "edit")
            ? await datasetService.getDraftDataset(datasetId, ["sample_data", "denorm_config"])
            : await datasetService.getDataset(datasetId, ["sample_data", "denorm_config"], true);

        const baseEvent = flattenEvent(_.get(dataset, "sample_data.mergedEvent") || {});
        const denormFields: Array<Record<string, any>> = _.get(dataset, "denorm_config.denorm_fields") || [];

        if (_.isEmpty(denormFields)) {
            return baseEvent;
        }

        const masterIds = _.uniq(_.map(denormFields, (field) => _.get(field, "dataset_id")));
        const masters = await datasetService.findDatasets(
            { dataset_id: { [Op.in]: masterIds }, type: "master" },
            ["dataset_id", "sample_data"]
        );
        const mastersById = _.keyBy(masters, "dataset_id");

        const mergedEvent: Record<string, any> = { ...baseEvent };
        for (const field of denormFields) {
            const master = mastersById[_.get(field, "dataset_id")];
            const masterEvent = _.get(master, "sample_data.mergedEvent");
            if (_.isEmpty(masterEvent)) {
                continue;
            }
            const flattenedMasterEvent = flattenEvent(masterEvent);
            const outField = _.get(field, "denorm_out_field");
            for (const key in flattenedMasterEvent) {
                mergedEvent[`${outField}.${key}`] = flattenedMasterEvent[key];
            }
        }

        return mergedEvent;
    }
}

export const denormPreviewService = new DenormPreviewService();
