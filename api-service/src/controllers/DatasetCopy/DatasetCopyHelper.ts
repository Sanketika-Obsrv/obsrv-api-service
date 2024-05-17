import * as _ from "lodash";
import { DatasetStatus } from "../../types/DatasetModels";
import { defaultMasterConfig } from "../../configs/DatasetConfigDefault";
const version = defaultMasterConfig.version;

export const setRequiredFieldsForDatasetRecord = (datasetRecord: any, newDatasetId: string, datasetId: any, isLive: boolean) => {
    const dataset_id = isLive ? (newDatasetId || datasetId) : (newDatasetId || `${datasetId}_copy`);
    _.set(datasetRecord, 'status', DatasetStatus.Draft)
    _.set(datasetRecord, 'updated_date', new Date())
    _.set(datasetRecord, "dataset_id", dataset_id)
    _.set(datasetRecord, "id", `${dataset_id}.${version}`)
    _.set(datasetRecord, "name", dataset_id)
    _.set(datasetRecord, "version_key", Date.now().toString())
}

export const updateDataset = (dataset: Record<string, any>): void => {
    _.set(dataset, 'id', dataset.dataset_id + "." + version);
    _.set(dataset, 'client_state', {
        metadata: {},
        pages: {}
    })
    _.set(dataset, 'version', version);
}

export const updateRecords = ({ datasetTransformationsRecords, datasetSourceConfigRecords, dataSourceRecords, dataset }: any, datasetId: string, newDatasetId: string, isLive: boolean): void => {
    _.map([dataset], (dataset) => {
        setRequiredFieldsForDatasetRecord(dataset, newDatasetId, datasetId, isLive)
    })
    _.map(datasetTransformationsRecords, (datasetTransformation) => {
        _.set(datasetTransformation, 'dataset_id', _.get(dataset, 'id'));
        _.set(datasetTransformation, 'id', _.get(datasetTransformation, 'dataset_id') + "_" + _.get(datasetTransformation, 'field_key'));
    })
    _.map(datasetSourceConfigRecords, (sourceConfig) => {
        _.set(sourceConfig, 'dataset_id', _.get(dataset, 'id'));
        _.set(sourceConfig, 'id', _.get(sourceConfig, 'dataset_id') + "_" + _.get(sourceConfig, 'connector_type'));
    })
    _.map(dataSourceRecords, (datasource) => {
        _.set(datasource, 'dataset_id', _.get(dataset, 'id'));
        _.set(datasource, 'id', _.get(datasource, 'dataset_id') + "_" + _.get(datasource, 'datasource'));
    })
}