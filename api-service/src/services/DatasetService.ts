import _ from "lodash";
import logger from "../logger";
import { Dataset } from "../models/Dataset";
import { DatasetDraft } from "../models/DatasetDraft";
import { DatasetTransformations } from "../models/Transformation";
import { DatasetTransformationsDraft } from "../models/TransformationDraft";
import Model from "sequelize/types/model";
import { DatasetSourceConfigDraft } from "../models/DatasetSourceConfigDraft";
import { query, sequelize } from "../connections/databaseConnection";
import { DatasetSourceConfig } from "../models/DatasetSourceConfig";
import { ConnectorInstances } from "../models/ConnectorInstances";
import { DatasourceDraft } from "../models/DatasourceDraft";
import { executeCommand } from "../connections/commandServiceConnection";
import Transaction from "sequelize/types/transaction";
import { DatasetStatus, DatasetType } from "../types/DatasetModels";
import { Datasource } from "../models/Datasource";
import { obsrvError } from "../types/ObsrvError";
import { druidHttpService } from "../connections/druidConnection";
import { tableGenerator } from "./TableGenerator";

class DatasetService {

    getDataset = async (datasetId: string, attributes?: string[], raw = false): Promise<any> => {
        return Dataset.findOne({ where: { id: datasetId }, attributes, raw: raw });
    }

    findDatasets = async (where?: Record<string, any>, attributes?: string[], order?: any): Promise<any> => {
        return Dataset.findAll({ where, attributes, order, raw: true })
    }

    getDuplicateDenormKey = (denormConfig: Record<string, any>): Array<string> => {
        if (denormConfig && _.isArray(_.get(denormConfig, "denorm_fields"))) {
            const denormFields = _.get(denormConfig, "denorm_fields")
            const denormOutKeys = _.map(denormFields, field => _.get(field, "denorm_out_field"))
            const duplicateDenormKeys: Array<string> = _.filter(denormOutKeys, (item: string, index: number) => _.indexOf(denormOutKeys, item) !== index);
            return duplicateDenormKeys;
        }
        return []
    }

    checkDatasetExists = async (dataset_id: string): Promise<boolean> => {
        const draft = await DatasetDraft.findOne({ where: { dataset_id }, attributes: ["id"], raw: true });
        if (draft === null) {
            const live = await Dataset.findOne({ where: { id: dataset_id }, attributes: ["id"], raw: true });
            return !(live === null)
        } else {
            return true;
        }
    }

    getDraftDataset = async (dataset_id: string, attributes?: string[]) => {
        return DatasetDraft.findOne({ where: { dataset_id }, attributes, raw: true });
    }

    findDraftDatasets = async (where?: Record<string, any>, attributes?: string[], order?: any): Promise<any> => {
        return DatasetDraft.findAll({ where, attributes, order, raw: true })
    }

    getDraftTransformations = async (dataset_id: string, attributes?: string[]) => {
        return DatasetTransformationsDraft.findAll({ where: { dataset_id }, attributes, raw: true });
    }

    getDraftConnectors = async (dataset_id: string, attributes?: string[]) => {
        return DatasetSourceConfigDraft.findAll({ where: { dataset_id }, attributes, raw: true });
    }

    getConnectorsV1 = async (dataset_id: string, attributes?: string[]) => {
        return DatasetSourceConfig.findAll({ where: { dataset_id }, attributes, raw: true });
    }

    getConnectors = async (dataset_id: string, attributes?: string[]): Promise<Record<string, any>> => {
        return ConnectorInstances.findAll({ where: { dataset_id }, attributes, raw: true });
    }

    getTransformations = async (dataset_id: string, attributes?: string[]) => {
        return DatasetTransformations.findAll({ where: { dataset_id }, attributes, raw: true });
    }

    updateDraftDataset = async (draftDataset: Record<string, any>): Promise<Record<string, any>> => {

        await DatasetDraft.update(draftDataset, { where: { id: draftDataset.id } });
        const responseData = { message: "Dataset is updated successfully", id: draftDataset.id, version_key: draftDataset.version_key };
        logger.info({ draftDataset, message: `Dataset updated successfully with id:${draftDataset.id}`, response: responseData });
        return responseData;
    }

    createDraftDataset = async (draftDataset: Record<string, any>): Promise<Record<string, any>> => {

        const response = await DatasetDraft.create(draftDataset);
        const responseData = { id: _.get(response, ["dataValues", "id"]) || "", version_key: draftDataset.version_key };
        logger.info({ draftDataset, message: `Dataset Created Successfully with id:${_.get(response, ["dataValues", "id"])}`, response: responseData });
        return responseData;
    }

    migrateDraftDataset = async (datasetId: string, dataset: Record<string, any>): Promise<any> => {
        const dataset_id = _.get(dataset, "id")
        const dataset_config: any = _.get(dataset, "dataset_config");
        const draftDataset = await this.migrateDatasetV1(dataset_id, dataset);
        const transaction = await sequelize.transaction();

        try {
            await DatasetDraft.update(draftDataset, { where: { id: dataset_id }, transaction });
            await DatasetTransformationsDraft.destroy({ where: { dataset_id }, transaction });
            await DatasetSourceConfigDraft.destroy({ where: { dataset_id }, transaction });
            await DatasourceDraft.destroy({ where: { dataset_id }, transaction });
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
        return await this.getDraftDataset(datasetId);
    }

    migrateDatasetV1 = async (dataset_id: string, dataset: Record<string, any>): Promise<any> => {
        const status = _.get(dataset, "status")
        let draftDataset: Record<string, any> = {
            api_version: "v2",
            version_key: Date.now().toString()
        }
        const dataset_config: any = _.get(dataset, "dataset_config");
        draftDataset["dataset_config"] = {
            indexing_config: { olap_store_enabled: true, lakehouse_enabled: false, cache_enabled: (_.get(dataset, "type") === "master") },
            keys_config: { data_key: dataset_config.data_key, timestamp_key: dataset_config.timestamp_key },
            cache_config: { redis_db_host: dataset_config.redis_db_host, redis_db_port: dataset_config.redis_db_port, redis_db: dataset_config.redis_db }
        }
        const transformationFields = ["field_key", "transformation_function", "mode", "metadata"]
        const transformations = _.includes([DatasetStatus.Live], status) ? await this.getTransformations(dataset_id, transformationFields) : await this.getDraftTransformations(dataset_id, transformationFields);
        draftDataset["transformations_config"] = _.map(transformations, (config) => {
            const section: any = _.get(config, "metadata.section");
            config = _.omit(config, "transformation_function.condition")
            return {
                field_key: _.get(config, ["field_key"]),
                transformation_function: {
                    ..._.get(config, ["transformation_function"]),
                    datatype: _.get(config, ["metadata._transformedFieldDataType"]) || "string",
                    category: this.getTransformationCategory(section)
                },
                mode: _.get(config, ["mode"])
            }
        })
        const connectorsFields = ["id", "connector_type", "connector_config"]
        const connectors = _.includes([DatasetStatus.Live], status) ? await this.getConnectorsV1(dataset_id, connectorsFields) : await this.getDraftConnectors(dataset_id, connectorsFields);
        draftDataset["connectors_config"] = _.map(connectors, (config) => {
            return {
                id: _.get(config, ["id"]),
                connector_id: _.get(config, ["connector_type"]),
                connector_config: _.get(config, ["connector_config"]),
                version: "v1"
            }
        })
        draftDataset["validation_config"] = _.omit(_.get(dataset, "validation_config"), ["validation_mode"])
        draftDataset["sample_data"] = dataset_config?.mergedEvent
        draftDataset["status"] = DatasetStatus.Draft
        return draftDataset;
    }

    getTransformationCategory = (section: string): string => {

        switch (section) {
            case "pii":
                return "pii";
            case "additionalFields":
                return "derived";
            case "derived":
                return "derived";
            default:
                return "transform";
        }
    }

    createDraftDatasetFromLive = async (dataset: Model<any, any>) => {

        let draftDataset: any = _.omit(dataset, ["created_date", "updated_date", "published_date"]);
        const dataset_config: any = _.get(dataset, "dataset_config");
        const api_version: any = _.get(dataset, "api_version");
        if (api_version === "v1") {
            draftDataset["dataset_config"] = {
                indexing_config: { olap_store_enabled: true, lakehouse_enabled: false, cache_enabled: (_.get(dataset, "type") === "master") },
                keys_config: { data_key: dataset_config.data_key, timestamp_key: dataset_config.timestamp_key },
                cache_config: { redis_db_host: dataset_config.redis_db_host, redis_db_port: dataset_config.redis_db_port, redis_db: dataset_config.redis_db }
            }
            const connectors = await this.getConnectorsV1(draftDataset.dataset_id, ["id", "connector_type", "connector_config"]);
            draftDataset["connectors_config"] = _.map(connectors, (config) => {
                return {
                    id: _.get(config, "id"),
                    connector_id: _.get(config, "connector_type"),
                    connector_config: _.get(config, "connector_config"),
                    version: "v1"
                }
            })
            const transformations = await this.getTransformations(draftDataset.dataset_id, ["field_key", "transformation_function", "mode", "metadata"]);
            draftDataset["transformations_config"] = _.map(transformations, (config) => {
                const section: any = _.get(config, "metadata.section");
                config = _.omit(config, "transformation_function.condition")
                return {
                    field_key: _.get(config, "field_key"),
                    transformation_function: {
                        ..._.get(config, ["transformation_function"]),
                        datatype: _.get(config, "metadata._transformedFieldDataType") || "string",
                        category: this.getTransformationCategory(section),
                    },
                    mode: _.get(config, "mode")
                }
            })
            draftDataset["api_version"] = "v2"
            draftDataset["sample_data"] = dataset_config?.mergedEvent
            draftDataset["validation_config"] = _.omit(_.get(dataset, "validation_config"), ["validation_mode"])
        } else {
            const connectors = await this.getConnectors(draftDataset.dataset_id, ["id", "connector_id", "connector_config", "operations_config"]);
            draftDataset["connectors_config"] = connectors
            const transformations = await this.getTransformations(draftDataset.dataset_id, ["field_key", "transformation_function", "mode"]);
            draftDataset["transformations_config"] = transformations
        }
        const denormConfig = _.get(draftDataset, "denorm_config")
        if (denormConfig && !_.isEmpty(denormConfig.denorm_fields)) {
            const masterDatasets = await datasetService.findDatasets({ status: DatasetStatus.Live, type: "master" }, ["id", "dataset_id", "status", "dataset_config", "api_version"])
            if (_.isEmpty(masterDatasets)) {
                throw { code: "DEPENDENT_MASTER_DATA_NOT_FOUND", message: `The dependent dataset not found`, errCode: "NOT_FOUND", statusCode: 404 }
            }
            const updatedDenormFields = _.map(denormConfig.denorm_fields, field => {
                const { redis_db, denorm_out_field, denorm_key } = field
                let masterConfig = _.find(masterDatasets, data => _.get(data, "dataset_config.cache_config.redis_db") === redis_db)
                if (!masterConfig) {
                    masterConfig = _.find(masterDatasets, data => _.get(data, "dataset_config.redis_db") === redis_db)
                }
                if (_.isEmpty(masterConfig)) {
                    throw { code: "DEPENDENT_MASTER_DATA_NOT_LIVE", message: `The dependent master dataset is not published`, errCode: "PRECONDITION_REQUIRED", statusCode: 428 }
                }
                return { denorm_key, denorm_out_field, dataset_id: _.get(masterConfig, "dataset_id") }
            })
            draftDataset["denorm_config"] = { ...denormConfig, denorm_fields: updatedDenormFields }
        }
        draftDataset["version_key"] = Date.now().toString()
        draftDataset["version"] = _.add(_.get(dataset, ["version"]), 1); // increment the dataset version
        draftDataset["status"] = DatasetStatus.Draft
        await DatasetDraft.create(draftDataset);
        return await this.getDraftDataset(draftDataset.dataset_id);
    }

    getNextRedisDBIndex = async () => {
        return await query("SELECT nextval('redis_db_index')")
    }

    deleteDraftDataset = async (dataset: Record<string, any>) => {

        const { id } = dataset
        const transaction = await sequelize.transaction()
        try {
            await DatasetTransformationsDraft.destroy({ where: { dataset_id: id }, transaction })
            await DatasetSourceConfigDraft.destroy({ where: { dataset_id: id }, transaction })
            await DatasourceDraft.destroy({ where: { dataset_id: id }, transaction })
            await DatasetDraft.destroy({ where: { id }, transaction })
            await transaction.commit()
        } catch (err: any) {
            await transaction.rollback()
            throw obsrvError(dataset.id, "FAILED_TO_DELETE_DATASET", err.message, "SERVER_ERROR", 500, err)
        }
    }

    retireDataset = async (dataset: Record<string, any>) => {

        const transaction = await sequelize.transaction();
        try {
            await Dataset.update({ status: DatasetStatus.Retired }, { where: { id: dataset.id }, transaction });
            await DatasetSourceConfig.update({ status: DatasetStatus.Retired }, { where: { dataset_id: dataset.id }, transaction });
            await Datasource.update({ status: DatasetStatus.Retired }, { where: { dataset_id: dataset.id }, transaction });
            await DatasetTransformations.update({ status: DatasetStatus.Retired }, { where: { dataset_id: dataset.id }, transaction });
            await transaction.commit();
            await this.deleteDruidSupervisors(dataset);
        } catch (err: any) {
            await transaction.rollback();
            throw obsrvError(dataset.id, "FAILED_TO_RETIRE_DATASET", err.message, "SERVER_ERROR", 500, err);
        }
    }

    findDatasources = async (where?: Record<string, any>, attributes?: string[], order?: any): Promise<any> => {
        return Datasource.findAll({ where, attributes, order, raw: true })
    }

    private deleteDruidSupervisors = async (dataset: Record<string, any>) => {

        try {
            if (dataset.type !== DatasetType.master) {
                const datasourceRefs = await Datasource.findAll({ where: { dataset_id: dataset.id }, attributes: ["datasource_ref"], raw: true })
                for (const sourceRefs of datasourceRefs) {
                    const datasourceRef = _.get(sourceRefs, "datasource_ref")
                    await druidHttpService.post(`/druid/indexer/v1/supervisor/${datasourceRef}/terminate`)
                    logger.info(`Datasource ref ${datasourceRef} deleted from druid`)
                }
            }
        } catch (error: any) {
            logger.error({ error: _.get(error, "message"), message: `Failed to delete supervisors for dataset:${dataset.id}` })
        }
    }

    publishDataset = async (draftDataset: Record<string, any>) => {

        const indexingConfig = draftDataset.dataset_config.indexing_config;
        const transaction = await sequelize.transaction()
        try {
            await DatasetDraft.update(draftDataset, { where: { id: draftDataset.id }, transaction })
            if (indexingConfig.olap_store_enabled) {
                await this.createDruidDataSource(draftDataset, transaction);
            }
            if (indexingConfig.lakehouse_enabled) {
                const liveDataset = await this.getDataset(draftDataset.dataset_id, ["id", "api_version"], true);

                if (liveDataset && liveDataset.api_version === "v2") {
                    await this.updateHudiDataSource(draftDataset, transaction)
                } else {
                    await this.createHudiDataSource(draftDataset, transaction)
                }
            }
            await transaction.commit()
        } catch (err: any) {
            await transaction.rollback()
            throw obsrvError(draftDataset.id, "FAILED_TO_PUBLISH_DATASET", err.message, "SERVER_ERROR", 500, err);
        }
        await executeCommand(draftDataset.id, "PUBLISH_DATASET");

    }

    private createDruidDataSource = async (draftDataset: Record<string, any>, transaction: Transaction) => {

        const allFields = await tableGenerator.getAllFields(draftDataset, "druid");
        const draftDatasource = this.createDraftDatasource(draftDataset, "druid");
        const ingestionSpec = tableGenerator.getDruidIngestionSpec(draftDataset, allFields, draftDatasource.datasource_ref);
        _.set(draftDatasource, 'ingestion_spec', ingestionSpec)
        await DatasourceDraft.create(draftDatasource, { transaction })
    }

    private createHudiDataSource = async (draftDataset: Record<string, any>, transaction: Transaction) => {

        const allFields = await tableGenerator.getAllFields(draftDataset, "hudi");
        const draftDatasource = this.createDraftDatasource(draftDataset, "hudi");
        const ingestionSpec = tableGenerator.getHudiIngestionSpecForCreate(draftDataset, allFields, draftDatasource.datasource_ref);
        _.set(draftDatasource, 'ingestion_spec', ingestionSpec)
        await DatasourceDraft.create(draftDatasource, { transaction })
    }

    private updateHudiDataSource = async (draftDataset: Record<string, any>, transaction: Transaction) => {

        const allFields = await tableGenerator.getAllFields(draftDataset, "hudi");
        const draftDatasource = this.createDraftDatasource(draftDataset, "hudi");
        const dsId = _.join([draftDataset.dataset_id, "events", "hudi"], "_")
        const liveDatasource = await Datasource.findOne({ where: { id: dsId }, attributes: ["ingestion_spec"], raw: true }) as unknown as Record<string, any>
        const ingestionSpec = tableGenerator.getHudiIngestionSpecForUpdate(draftDataset, liveDatasource?.ingestion_spec, allFields, draftDatasource?.datasource_ref);
        _.set(draftDatasource, 'ingestion_spec', ingestionSpec)
        await DatasourceDraft.create(draftDatasource, { transaction })
    }

    private createDraftDatasource = (draftDataset: Record<string, any>, type: string): Record<string, any> => {

        const datasource = _.join([draftDataset.dataset_id, "events"], "_")
        return {
            id: _.join([datasource, type], '_'),
            datasource: draftDataset.dataset_id,
            dataset_id: draftDataset.dataset_id,
            datasource_ref: datasource,
            type
        }
    }

}

export const getLiveDatasetConfigs = async (dataset_id: string) => {

    let datasetRecord = await datasetService.getDataset(dataset_id, undefined, true)
    const transformations = await datasetService.getTransformations(dataset_id, ["field_key", "transformation_function", "mode"])
    const connectors = await datasetService.getConnectors(dataset_id, ["id", "connector_id", "connector_config", "operations_config"])

    if (!_.isEmpty(transformations)) {
        datasetRecord["transformations_config"] = transformations
    }
    if (!_.isEmpty(connectors)) {
        datasetRecord["connectors_config"] = connectors
    }
    return datasetRecord;
}

export const datasetService = new DatasetService();