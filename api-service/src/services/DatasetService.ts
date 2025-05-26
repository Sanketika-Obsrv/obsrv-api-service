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
import { deleteAlertByDataset, deleteMetricAliasByDataset } from "./managers";
import { config } from "../configs/Config";
import { Op } from "sequelize";
import TableDraft from "../models/Table";
import { alertService } from "./AlertManagerService";
import { ConnectorRegistry } from "../models/ConnectorRegistry";

class DatasetService {

    getDataset = async (datasetId: string, attributes?: string[], raw = false): Promise<any> => {
        return Dataset.findOne({ where: { id: datasetId }, attributes, raw: raw });
    }

    getDatasourceWithKey = async (datasourceKey: string, attributes?: string[], raw = false, is_primary?: boolean): Promise<any> => {
        const whereCondition: any = {
            [Op.or]: [{ datasource: datasourceKey }, { id: datasourceKey }]
        };

        if (is_primary) {
            whereCondition.is_primary = true;
        }

        return Datasource.findOne({
            where: whereCondition,
            attributes,
            raw: raw
        });
    }

    getDatasetWithDatasetkey = async (datasetKey: string, attributes?: string[], raw = false): Promise<any> => {
        const datasource = await this.getDatasourceWithKey(datasetKey, ["datasource_ref", "dataset_id"], true, true)
        const dataset_id = !_.isEmpty(datasource) ? _.get(datasource, "dataset_id") : datasetKey
        return Dataset.findOne({
            where: { dataset_id }, attributes, raw: raw
        });
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

    checkDatasourceExist = async (id: string): Promise<boolean> => {
        const datasourceRef = await this.getDatasourceWithKey(id, ["id"], true);
        if (_.isEmpty(datasourceRef)) {
            const tables = TableDraft.findOne({ where: { id }, attributes: ["id"], raw: true }).catch((err: any) => {
                if (err?.original?.code === '42P01') {
                    logger.warn("Table 'table_draft' does not exist, returning empty array.");
                    return null
                }
                throw obsrvError("", "FAILED_TO_FETCH_TABLES", err.message, "SERVER_ERROR", 500, err);
            })
            return !_.isEmpty(tables)
        }
        return true;
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

    getDatasource = async (datasource_id: string, attributes?: string[]) => {
        return Datasource.findOne({ where: { id: datasource_id }, attributes, raw: true });
    }

    getDatasetIdWithDatasource = async (dataSource_ref: string, attributes?: string[]): Promise<Record<string, any> | any>  => {
        try {
            return Datasource.findOne({ where: { datasource_ref: dataSource_ref }, attributes, raw: true }); 
        } catch (error) {
             console.error("Error fetching dataset ID:", error); 
             return null; 
        }
    }

    updateDatasource = async (payload: Record<string, any>, where: Record<string, any>): Promise<Record<string, any>> => {
        return Datasource.update(payload, { where });
    }

    getTransformations = async (dataset_id: string, attributes?: string[]) => {
        return DatasetTransformations.findAll({ where: { dataset_id }, attributes, raw: true });
    }

    getLiveDatasets = async (filters: Record<string, any>, attributes?: string[]): Promise<Record<string, any>> => {
        Dataset.hasMany(Datasource, { foreignKey: 'dataset_id' });
        const datasets = await Dataset.findAll({
            include: [
                {
                    model: Datasource,
                    attributes: ['datasource'],
                    where: { is_primary: true, type: "druid" },
                    required: false
                },
            ], raw: true, where: filters, attributes, order: [["updated_date", "DESC"]]
        });
        const updatedDatasets = _.map(datasets, (dataset) => ({ ...dataset, alias: _.get(dataset, "datasources.datasource") }))
        return updatedDatasets;
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

    migrateDraftDataset = async (datasetId: string, dataset: Record<string, any>, userID: string): Promise<any> => {
        const dataset_id = _.get(dataset, "id")
        const draftDataset = await this.migrateDatasetV1(dataset_id, dataset);
        _.set(draftDataset, "updated_by", userID);
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
        const draftDataset: Record<string, any> = {
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
        draftDataset["connectors_config"] = [];
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

    createDraftDatasetFromLive = async (dataset: Model<any, any>, userID: string) => {

        const draftDataset: any = _.omit(dataset, ["created_date", "updated_date", "published_date"]);
        const dataset_config: any = _.get(dataset, "dataset_config");
        const api_version: any = _.get(dataset, "api_version");
        if (api_version === "v1") {
            draftDataset["dataset_config"] = {
                indexing_config: { olap_store_enabled: true, lakehouse_enabled: false, cache_enabled: (_.get(dataset, "type") === "master") },
                keys_config: { data_key: dataset_config.data_key, timestamp_key: dataset_config.timestamp_key },
                cache_config: { redis_db_host: dataset_config.redis_db_host, redis_db_port: dataset_config.redis_db_port, redis_db: dataset_config.redis_db }
            }
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
            draftDataset["connectors_config"] = [];
            draftDataset["api_version"] = "v2"
            draftDataset["sample_data"] = dataset_config?.mergedEvent
            draftDataset["validation_config"] = _.omit(_.get(dataset, "validation_config"), ["validation_mode"])
        } else {
            const v2connectors = await this.getConnectors(draftDataset.dataset_id, ["id", "connector_id", "connector_config", "operations_config"]);
            const updatedConnectorsPayload = getUpdatedV2ConnectorsPayload(v2connectors)
            draftDataset["connectors_config"] = updatedConnectorsPayload;
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
        draftDataset["created_by"] = userID;
        const result = await DatasetDraft.create(draftDataset);
        return _.get(result, "dataValues")
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

    private deleteAlerts = async (dataset: any) => {
        await deleteAlertByDataset(dataset);
        await deleteMetricAliasByDataset(dataset);
    }

    retireDataset = async (dataset: Record<string, any>, updatedBy: any) => {

        const transaction = await sequelize.transaction();
        try {
            await Dataset.update({ status: DatasetStatus.Retired, updated_by: updatedBy, alias: null }, { where: { id: dataset.id }, transaction });
            await DatasetSourceConfig.update({ status: DatasetStatus.Retired, updated_by: updatedBy }, { where: { dataset_id: dataset.id }, transaction });
            await Datasource.update({ status: DatasetStatus.Retired, updated_by: updatedBy }, { where: { dataset_id: dataset.id }, transaction });
            await DatasetTransformations.update({ status: DatasetStatus.Retired, updated_by: updatedBy }, { where: { dataset_id: dataset.id }, transaction });
            await transaction.commit();
        } catch (err: any) {
            await transaction.rollback();
            throw obsrvError(dataset.id, "FAILED_TO_RETIRE_DATASET", err.message, "SERVER_ERROR", 500, err);
        }
        // Deleting dataset alerts and druid supervisors
        await this.deleteDruidSupervisors(dataset);
        await this.deleteAlerts(dataset);
    }

    findDatasources = async (where?: Record<string, any>, attributes?: string[], order?: any): Promise<any> => {
        return Datasource.findAll({ where, attributes, order, raw: true })
    }

    findDraftDatasources = async (where?: Record<string, any>, attributes?: string[], order?: any): Promise<any> => {
        return TableDraft.findAll({ where, attributes, order, raw: true }).catch((err: any) => {
            if (err?.original?.code === '42P01') {
                logger.warn("Table 'table_draft' does not exist, returning empty array.");
                return [];
            }
            throw obsrvError("", "FAILED_TO_FETCH_TABLES", err.message, "SERVER_ERROR", 500, err);
        });
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

    publishDataset = async (draftDataset: Record<string, any>, userToken: string) => {

        const indexingConfig = draftDataset.dataset_config.indexing_config;
        const transaction = await sequelize.transaction()
        const liveDataset = await this.getDataset(draftDataset.dataset_id)
        try {
            await DatasetDraft.update(draftDataset, { where: { id: draftDataset.id }, transaction })
            let datasource_ref: any
            if (indexingConfig.olap_store_enabled) {
                const existingDatasource = await Datasource.findAll({ where: { dataset_id: draftDataset.dataset_id }, raw: true }) as unknown as Record<string, any>
                const getDatasetDatasource = _.find(existingDatasource, datasource => !_.get(datasource, "metadata.aggregated") && _.get(datasource, "metadata.granularity") === "day")
                if (!_.isEmpty(getDatasetDatasource)) {
                    datasource_ref = await this.updateDruidDataSource(draftDataset, transaction, getDatasetDatasource);
                }
                else {
                    datasource_ref = await this.createDruidDataSource(draftDataset, transaction);
                }
            }
            if (indexingConfig.lakehouse_enabled) {
                const liveDataset = await this.getDataset(draftDataset.dataset_id, ["id", "api_version"], true);
                if (liveDataset && liveDataset.api_version === "v2") {
                    await this.updateHudiDataSource(draftDataset, transaction)
                } else {
                    await this.createHudiDataSource(draftDataset, transaction)
                }
            }
            if (_.isEmpty(liveDataset)) {
                await alertService.createDatasetAlertsDraft(draftDataset, transaction, datasource_ref);
            }
            await transaction.commit()
        } catch (err: any) {
            await transaction.rollback()
            throw obsrvError(draftDataset.id, "FAILED_TO_PUBLISH_DATASET", err.message, "SERVER_ERROR", 500, err);
        }
        await executeCommand(draftDataset.dataset_id, "PUBLISH_DATASET", userToken);
        if (_.isEmpty(liveDataset)) {
            await alertService.publishAlertRule(draftDataset.dataset_id)
        }
    }

    private createDruidDataSource = async (draftDataset: Record<string, any>, transaction: Transaction) => {

        const { created_by, updated_by } = draftDataset;
        const allFields = await tableGenerator.getAllFields(draftDataset, "druid");
        const draftDatasource = this.createDraftDatasource(draftDataset, "druid");
        const ingestionSpec = tableGenerator.getDruidIngestionSpec(draftDataset, allFields, draftDatasource.datasource_ref);
        _.set(draftDatasource, "ingestion_spec", ingestionSpec)
        _.set(draftDatasource, "created_by", created_by);
        _.set(draftDatasource, "updated_by", updated_by);
        await DatasourceDraft.upsert(draftDatasource, { transaction })
        return draftDatasource.datasource_ref
    }

    private updateDruidDataSource = async (draftDataset: Record<string, any>, transaction: Transaction, existingDatasource: Record<string, any>) => {

        const { created_by, updated_by } = draftDataset;
        const allFields = await tableGenerator.getAllFields(draftDataset, "druid");
        const ingestionSpec = tableGenerator.getDruidIngestionSpec(draftDataset, allFields, existingDatasource.datasource_ref);
        let draftDatasource = existingDatasource
        _.set(draftDatasource, "ingestion_spec", ingestionSpec)
        _.set(draftDatasource, "created_by", created_by);
        _.set(draftDatasource, "updated_by", updated_by);
        _.set(draftDatasource, "type", "druid");
        await DatasourceDraft.upsert(draftDatasource, { transaction })
        return existingDatasource.datasource_ref
    }

    private createHudiDataSource = async (draftDataset: Record<string, any>, transaction: Transaction) => {

        const { created_by, updated_by } = draftDataset;
        const allFields = await tableGenerator.getAllFieldsHudi(draftDataset, "datalake");
        const draftDatasource = this.createDraftDatasource(draftDataset, "datalake");
        const ingestionSpec = tableGenerator.getHudiIngestionSpecForCreate(draftDataset, allFields, draftDatasource.datasource_ref);
        _.set(draftDatasource, "ingestion_spec", ingestionSpec)
        _.set(draftDatasource, "created_by", created_by);
        _.set(draftDatasource, "updated_by", updated_by);
        await DatasourceDraft.upsert(draftDatasource, { transaction })
    }

    private updateHudiDataSource = async (draftDataset: Record<string, any>, transaction: Transaction) => {

        const { created_by, updated_by } = draftDataset;
        const allFields = await tableGenerator.getAllFieldsHudi(draftDataset, "datalake");
        const draftDatasource = this.createDraftDatasource(draftDataset, "datalake");
        const dsId = _.join([draftDataset.dataset_id, "events", "datalake"], "_")
        const liveDatasource = await Datasource.findOne({ where: { id: dsId }, attributes: ["ingestion_spec"], raw: true }) as unknown as Record<string, any>
        const ingestionSpec = tableGenerator.getHudiIngestionSpecForUpdate(draftDataset, liveDatasource?.ingestion_spec, allFields, draftDatasource?.datasource_ref);
        _.set(draftDatasource, "ingestion_spec", ingestionSpec)
        _.set(draftDatasource, "created_by", created_by);
        _.set(draftDatasource, "updated_by", updated_by);
        await DatasourceDraft.upsert(draftDatasource, { transaction })
    }

    private createDraftDatasource = (draftDataset: Record<string, any>, type: string): Record<string, any> => {

        const datasource = _.join([draftDataset.dataset_id, "events"], "_")
        return {
            id: _.join([datasource, type], "_"),
            datasource: _.join([draftDataset.dataset_id, type], "_"),
            dataset_id: draftDataset.id,
            datasource_ref: datasource,
            type
        }
    }

}

export const getLiveDatasetConfigs = async (dataset_id: string) => {

    const datasetRecord = await datasetService.getDataset(dataset_id, undefined, true)
    const transformations = await datasetService.getTransformations(dataset_id, ["field_key", "transformation_function", "mode"])
    const connectors = await datasetService.getConnectors(dataset_id, ["id", "connector_id", "connector_config", "operations_config"])
    const updatedConnectorsPayload = getUpdatedV2ConnectorsPayload(connectors)

    if (!_.isEmpty(transformations)) {
        datasetRecord["transformations_config"] = transformations
    }
    if (!_.isEmpty(connectors)) {
        datasetRecord["connectors_config"] = updatedConnectorsPayload
    }
    return datasetRecord;
}

export const getUpdatedV2ConnectorsPayload = (connectors: Record<string, any>) => {
    return _.map(connectors, connector => ({ ...connector, "version": "v2" }))
}

const storageTypes = JSON.parse(config.storage_types)
export const validateStorageSupport = (dataset: Record<string, any>) => {
    const { olap_store_enabled, lakehouse_enabled } = _.get(dataset, ["dataset_config", "indexing_config"]) || {}
    const validStorageType = _.keys(storageTypes).filter(key => storageTypes[key] === true);
    if (olap_store_enabled && !_.get(storageTypes, "realtime_store") === true) {
        throw obsrvError("", "DATASET_UNSUPPORTED_STORAGE_TYPE", `The storage type "realtime_store" is not available. Please use one of the available storage types: ${validStorageType}`, "BAD_REQUEST", 400)
    }
    if (lakehouse_enabled && !_.get(storageTypes, "lake_house") == true) {
        throw obsrvError("", "DATASET_UNSUPPORTED_STORAGE_TYPE", `The storage type "lake_house" is not available. Please use one of the available storage types: ${validStorageType}`, "BAD_REQUEST", 400)
    }
}

export const attachDraftConnectors = async (
    draftDatasetList: Record<string, any>[],
    connectorFilter: string | string[]
): Promise<Record<string, any>[]> => {
    if (_.isEmpty(draftDatasetList)) {
        return [];
    }

    const connectorIds = _.uniq(
        _.flatMap(draftDatasetList, dataset =>
            _.map(dataset.connectors_config, 'connector_id')
        )
    );

    if (_.isEmpty(connectorIds)) {
        return draftDatasetList.map(dataset => ({
            ...dataset,
            connectors_config: []
        }));
    }

    const connectorRegistry: any = await ConnectorRegistry.findAll({
        where: { id: connectorIds },
        raw: true,
        attributes: ['id', 'name', 'category', 'type']
    });

    return draftDatasetList.map(dataset => {
        let filteredConnectors = dataset.connectors_config;
        if (connectorFilter !== 'all') {
            const filterArray = _.castArray(connectorFilter); // Ensure it's an array
            filteredConnectors = _.filter(filteredConnectors, connector =>
                filterArray.includes(String(connector.connector_id))
            );
        }

        const enrichedConnectors = filteredConnectors.map((connector: any) => {
            const registryDetails = _.find(connectorRegistry, {
                id: connector.connector_id
            });
            return {
                ...connector,
                name: registryDetails?.name || null,
                category: registryDetails?.category || null,
                source: registryDetails?.type || null
            };
        });

        return {
            ...dataset,
            connectors_config: enrichedConnectors
        };
    });
};

export const attachLiveConnectors = async (
    liveDatasetList: Record<string, any>,
    connectorFilter: string | string[]
): Promise<Record<string, any>[]> => {
    if (_.isEmpty(liveDatasetList)) {
        return [];
    }

    ConnectorRegistry.hasMany(ConnectorInstances, { foreignKey: 'connector_id' });
    const connectorRegistry = await ConnectorRegistry.findAll({
        include: [{
            model: ConnectorInstances,
            attributes: ['dataset_id', 'connector_id'],
            required: true
        }],
        raw: true,
        attributes: ['id', 'name', 'category', 'type']
    });

    const filterArray = connectorFilter === 'all' ? null : _.castArray(connectorFilter);

    return liveDatasetList.map((dataset: Record<string, any>) => {
        const datasetId = dataset.dataset_id;

        const filteredConnectors = connectorRegistry.filter((connector: any) =>
            connector['connector_instances.dataset_id'] === datasetId &&
            (!filterArray || filterArray.includes(String(connector.id)))
        );

        const enrichedConnectors = filteredConnectors.map((connector: any) => ({
            connector_id: connector.id,
            name: connector.name,
            category: connector.category,
            type: connector.type
        }));

        return {
            ...dataset,
            connectors_config: enrichedConnectors
        };
    });
};

export const datasetService = new DatasetService();