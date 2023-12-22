import { Request, Response, NextFunction } from "express";
import _ from 'lodash'
import { DatasetSourceConfigs } from "../helpers/DatasetSourceConfigs";
import { DbUtil } from "../helpers/DbUtil";
import { findAndSetExistingRecord, updateTelemetryAuditEvent } from "./telemetry";
import { ErrorResponseHandler } from "../helpers/ErrorResponseHandler";
import { DatasetStatus, IConnector } from "../models/DatasetModels";

const telemetryObject = { id: null, type: "dataset-source-config", ver: "1.0.0" };

export class DatasetSourceConfigService {
    private table: string
    private dbConnector: IConnector;
    private dbUtil: DbUtil
    private errorHandler: ErrorResponseHandler;
    constructor(dbConnector: IConnector, table: string) {
        this.dbConnector = dbConnector
        this.table = table
        this.dbUtil = new DbUtil(dbConnector, table)
        this.errorHandler = new ErrorResponseHandler("DatasetSourceConfigService");
    }

    public save = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const datasetSourceConfig = new DatasetSourceConfigs(req.body)
            const payload: any = datasetSourceConfig.setValues()
            updateTelemetryAuditEvent({ request: req, object: { ...telemetryObject, id: _.get(payload, 'id') } });
            await this.dbUtil.save(req, res, next, payload)
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error) }
    }
    public update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const datasetSourceConfig = new DatasetSourceConfigs(req.body)
            const payload: Record<string, any> = datasetSourceConfig.setValues()
            await findAndSetExistingRecord({ dbConnector: this.dbConnector, table: this.table, request: req, filters: { "id": _.get(payload, 'id') }, object: { ...telemetryObject, id: _.get(payload, 'id') } });
            await this.dbUtil.upsert(req, res, next, payload)
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error) }
    }
    public read = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let status: any = req.query.status || DatasetStatus.Live
            const id = req.params.datasetId
            updateTelemetryAuditEvent({ request: req, object: { ...telemetryObject, id } });
            await this.dbUtil.read(req, res, next, { id, status })
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false) }
    }
    public list = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = req.body
            await this.dbUtil.list(req, res, next, payload)
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error, false) }
    }
}
