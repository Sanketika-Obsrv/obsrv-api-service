import _ from 'lodash'
import { DatasourceInsertRequest } from "../models/DatabaseOperationModels"

export class Datasources {
    private id: string
    private dataset_id: string
    private ingestion_spec: object
    private datasource: string
    private retention_period: object
    private archival_policy: object
    private purge_policy: object
    private backup_config: object
    private status: string
    private created_by: string
    private updated_by: string

    constructor(payload: DatasourceInsertRequest) {
        this.id = payload.id
        this.dataset_id = payload.dataSetId
        this.ingestion_spec = payload.ingestionSpec
        this.datasource = payload.dataSource
        this.retention_period = payload.retentionPeriod
        this.archival_policy = payload.archivalPolicy
        this.purge_policy = payload.purgePolicy
        this.backup_config = payload.backupConfig
        this.status = payload.status
        this.created_by = payload.createdBy
        this.updated_by = payload.updatedBy
    }
    public getColumns() {
        return { id: this.id, dataset_id: this.dataset_id, ingestion_spec: this.ingestion_spec, datasource: this.datasource, retention_period: this.retention_period, archival_policy: this.archival_policy, purge_policy: this.purge_policy, backup_config: this.backup_config, status: this.status, created_by: this.created_by, updated_by: this.updated_by }
    }
    public insertColumns() {
        return Object.assign(this.getColumns(), { "created_date": new Date, "updated_date": new Date })
    }
    public updateColumns() {
        return Object.assign(this.cleanColumns(this.getColumns()), { "updated_date": new Date })
    }
    public cleanColumns(tempObject: any) {
        Object.keys(tempObject).forEach((column) => {
            if (_.isEmpty(tempObject[column])) delete tempObject[column]
        })
        return tempObject
    }
}