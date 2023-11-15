import _ from 'lodash'
import { ValidationConfig, ExtractionConfig, DedupConfig, DenormConfig, RouterConfig, DatasetConfig } from '../models/ConfigModels'
import { defaultConfig } from '../resources/schemas/DatasetConfigDefault'
import { SchemaMerger } from '../generators/SchemaMerger'
import { config } from '../configs/Config'
let schemaMerger = new SchemaMerger()
export class Datasets {
    private id: string
    private type: string
    private name: string
    private dataset_id: string
    private validation_config: object
    private extraction_config: object
    private dedup_config: object
    private data_schema: object
    private router_config: object
    private denorm_config: object
    private dataset_config: object
    private tags: any
    private status: string
    private created_by: string
    private updated_by: string
    private published_date: Date
    constructor(payload: any) {
        if (payload.id) {
            this.id = payload.id
        }
        else {
            this.id = payload.dataset_id
        }
        this.dataset_id = payload.dataset_id
        this.type = payload.type
        this.name = payload.name
        this.validation_config = payload.validation_config
        this.extraction_config = payload.extraction_config
        this.dedup_config = payload.dedup_config
        this.data_schema = payload.data_schema
        this.router_config = payload.router_config
        this.denorm_config = payload.denorm_config
        this.dataset_config = payload.dataset_config
        this.tags = payload.tags
        this.status = payload.status
        this.created_by = payload.created_by
        this.updated_by = payload.updated_by
        this.published_date = payload.published_date
    }

    public getValues() {
        return Object.assign(this.removeNullValues({ id: this.id, dataset_id: this.dataset_id, type: this.type, name: this.name, validation_config: this.validation_config, extraction_config: this.extraction_config, dedup_config: this.dedup_config, data_schema: this.data_schema, router_config: this.router_config, denorm_config: this.denorm_config, dataset_config: this.dataset_config, tags: this.tags, status: this.status, created_by: this.created_by, updated_by: this.updated_by, published_date: this.published_date }), { "updated_date": new Date })
    }

    public setValues() {
        return schemaMerger.mergeSchema(this.getDefaults(), this.getValues())
    }

    public removeNullValues(payload: any) {
        Object.keys(payload).forEach((value) => {
            if (_.isEmpty(payload[value])) delete payload[value]
        })
        return payload
    }

    public getDefaults() {
        if (this.type == config.dataset_types.masterDataset) {
            return {...defaultConfig.master}
        }
        else {
            return {...defaultConfig.dataset}
        }
    }
}