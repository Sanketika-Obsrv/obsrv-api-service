export class Datasets {
    private id: string
    private validation_config: object
    private extraction_config: object
    private dedup_config: object
    private data_schema: object
    private router_config: object
    private denorm_config: object
    private status: string
    private created_by: string
    private updated_by: string
    private created_date: Date
    private updated_date: Date

    constructor(payload: any) {
        this.id = payload.dataset
        this.validation_config = payload.validateConfig
        this.extraction_config = payload.extractionConfig
        this.dedup_config = payload.dedupConfig
        this.data_schema = payload.dataSchema
        this.router_config = payload.routerConfig
        this.denorm_config = payload.denormConfig
        this.status = payload.status
        this.created_by = payload.createdBy
        this.updated_by = payload.updatedBy
        this.created_date = new Date
        this.updated_date = new Date
    }
    public getColumns() {
        return { id: this.id, validation_config: this.validation_config, extraction_config: this.extraction_config, dedup_config: this.dedup_config, data_schema: this.data_schema, router_config: this.router_config, denorm_config: this.denorm_config, status: this.status, created_by: this.created_by, updated_by: this.updated_by, created_date: this.created_date, updated_date: this.updated_date }
    }
}