import { Request, Response, NextFunction } from "express";
import _ from 'lodash'
import { Datasources } from "../helpers/Datasources";
import { IConnector } from "../models/IngestionModels";
import { findAndSetExistingRecord } from "./telemetry";
import { DbUtil } from "../helpers/DbUtil";
import constants from "../resources/Constants.json";
import { ingestorService } from "../routes/Router";
import { ErrorResponseHandler } from "../helpers/ErrorResponseHandler";
export class DataSourceService {
    private table: string
    private dbConnector: IConnector;
    private dbUtil: DbUtil
    private errorHandler: ErrorResponseHandler;
    constructor(dbConnector: IConnector, table: string) {
        this.dbConnector = dbConnector
        this.table = table
        this.dbUtil = new DbUtil(dbConnector, table)
        this.errorHandler = new ErrorResponseHandler("DataSourceService");
    }

    public save = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const datasources = new Datasources(req.body)
            const payload: any = datasources.setValues()
            await this.validateDatasource(payload)
            await this.dbUtil.save(req, res, next, payload)
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error) }
    }
    public update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const datasources = new Datasources(req.body)
            const payload: Record<string, any> = datasources.setValues()
            await this.validateDatasource(payload)
            await findAndSetExistingRecord({ dbConnector: this.dbConnector, table: this.table, request: req, filters: { "id": payload.id }, object: { id: payload.id, type: "datasource" } });
            await this.dbUtil.upsert(req, res, next, payload)
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error) }
    }
    public read = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let status: any = req.query.status || "ACTIVE"
            const id = req.params.datasourceId
            await this.dbUtil.read(req, res, next, { id, status })
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false) }
    }
    public list = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = req.body
            await this.dbUtil.list(req, res, next, payload)
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false) }
    }
    public validateDatasource = async (payload: Record<string, any>) => {
        let datasetRecord = await ingestorService.getDatasetConfig(payload.dataset_id);
        if (_.isEmpty(datasetRecord)) {
            throw constants.DATASET_NOT_FOUND;
        }
        if (!_.isUndefined(payload.datasource_ref) &&!_.isUndefined(payload.ingestion_spec.spec.dataSchema.dataSource) && payload.datasource_ref !== payload.ingestion_spec.spec.dataSchema.dataSource) {
            throw constants.INVALID_DATASOURCE_REF;
        }
        if (
            !_.isUndefined(payload.dataset_id) && !_.isUndefined(payload.ingestion_spec) && datasetRecord.router_config.topic !== payload.ingestion_spec.spec.ioConfig.topic) {
            throw constants.INVALID_TOPIC;
        }
    }
    
}
