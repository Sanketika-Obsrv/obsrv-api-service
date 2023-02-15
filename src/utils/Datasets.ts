import _ from 'lodash'
import { DatasetInsertRequest } from "../models/DatabaseOperationModels"

export class Datasets {
    private id: string
    private validation_config: object
    private extraction_config: object
    private dedup_config: object
    private json_schema: object
    private router_config: object
    private denorm_config: object
    private status: string
    private created_by: string
    private updated_by: string

    constructor(payload: DatasetInsertRequest) {
        this.id = payload.dataSet
        this.validation_config = payload.validationConfig
        this.extraction_config = payload.extractionConfig
        this.dedup_config = payload.dedupConfig
        this.json_schema = payload.jsonSchema
        this.router_config = payload.routerConfig
        this.denorm_config = payload.denormConfig
        this.status = payload.status
        this.created_by = payload.createdBy
        this.updated_by = payload.updatedBy
    }
    public getColumns() {
        return { id: this.id, validation_config: this.validation_config, extraction_config: this.extraction_config, dedup_config: this.dedup_config, json_schema: this.json_schema, router_config: this.router_config, denorm_config: this.denorm_config, status: this.status, created_by: this.created_by, updated_by: this.updated_by }
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