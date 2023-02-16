import _ from 'lodash'
import { IRelation } from '../models/SchemaModels'

export class Datasources implements IRelation {
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

    constructor(payload: any) {
        this.id = payload.id
        this.dataset_id = payload.dataset_id
        this.ingestion_spec = payload.ingestion_spec
        this.datasource = payload.datasource
        this.retention_period = payload.retentionPeriod
        this.archival_policy = payload.archivalPolicy
        this.purge_policy = payload.purgePolicy
        this.backup_config = payload.backup_config
        this.status = payload.status
        this.created_by = payload.created_by
        this.updated_by = payload.updated_by
    }
    public getValues() {
        return { id: this.id, dataset_id: this.dataset_id, ingestion_spec: this.ingestion_spec, datasource: this.datasource, retention_period: this.retention_period, archival_policy: this.archival_policy, purge_policy: this.purge_policy, backup_config: this.backup_config, status: this.status, created_by: this.created_by, updated_by: this.updated_by }
    }

    public setValues() {
        return Object.assign(this.removeNullValues(this.getValues()), { "updated_date": new Date })
    }

    public removeNullValues(payload: any) {
        Object.keys(payload).forEach((value) => {
            if (_.isEmpty(payload[value])) delete payload[value]
        })
        return payload
    }
}