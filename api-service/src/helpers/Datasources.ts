import _ from 'lodash'
import configDefault from '../resources/schemas/DatasourceConfigDefault.json'
import { SchemaMerger } from '../generators/SchemaMerger'
import { DatasetStatus } from '../models/DatasetModels'
let schemaMerger = new SchemaMerger

export class Datasources {
    private id: string
    private dataset_id: string
    private ingestion_spec: object
    private lakehouse_spec: object
    private datasource: string
    private datasource_ref: string
    private retention_period: object
    private archival_policy: object
    private purge_policy: object
    private backup_config: object
    private status: DatasetStatus
    private created_by: string
    private updated_by: string
    private version: string
    private published_date: Date
    private metadata: object

    constructor(payload: any) {
        if (payload.id) {
            this.id = payload.id
        }
        else {
            this.id = payload.dataset_id + '_' + payload.datasource
        }
        this.dataset_id = payload.dataset_id
        this.ingestion_spec = payload.ingestion_spec
        this.lakehouse_spec = payload.lakehouse_spec
        this.datasource = payload.datasource
        this.datasource_ref = payload.datasource_ref
        this.retention_period = payload.retentionPeriod
        this.archival_policy = payload.archivalPolicy
        this.purge_policy = payload.purgePolicy
        this.backup_config = payload.backup_config
        this.status = payload.status
        this.version = payload.version
        this.created_by = payload.created_by
        this.updated_by = payload.updated_by
        this.published_date = payload.published_date
        this.metadata = payload.metadata
    }
    public getValues() {
        return Object.assign(this.removeNullValues({ id: this.id, dataset_id: this.dataset_id, ingestion_spec: this.ingestion_spec, lakehouse_spec: this.lakehouse_spec, datasource: this.datasource, datasource_ref: this.datasource_ref, retention_period: this.retention_period, archival_policy: this.archival_policy, purge_policy: this.purge_policy, backup_config: this.backup_config, status: this.status, version: this.version, created_by: this.created_by, updated_by: this.updated_by, published_date: this.published_date, metadata: this.metadata }), { "updated_date": new Date })
    }

    public setValues() {
        return schemaMerger.mergeSchema(this.getDefaults(), this.getValues());
    }

    public removeNullValues(payload: any) {
        Object.keys(payload).map((value) => {
            if (_.isEmpty(payload[value])) delete payload[value]
        })
        return payload
    }
    public getDefaults() {
        return {...configDefault}
    }
}
