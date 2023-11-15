import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import _ from 'lodash'
import { DatasetSourceConfigs } from "../helpers/DatasetSourceConfigs";
import { IConnector } from "../models/IngestionModels";
import { DbUtil } from "../helpers/DbUtil";
import { findAndSetExistingRecord, setAuditState } from "./telemetry";

export class DatasetSourceConfigService {
    private table: string
    private dbConnector: IConnector;
    private dbUtil: DbUtil
    constructor(dbConnector: IConnector, table: string) {
        this.dbConnector = dbConnector
        this.table = table
        this.dbUtil = new DbUtil(dbConnector, table)
    }
    public save = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const datasetSourceConfig = new DatasetSourceConfigs(req.body)
            const payload: any = datasetSourceConfig.setValues()
            await this.dbUtil.save(req, res, next, payload)
        }
        catch (error: any) {
            console.error(error.message)
            setAuditState("failed", req);
            next({ statusCode: error.status || httpStatus.INTERNAL_SERVER_ERROR, message: error.message, errCode: error.code || httpStatus["500_NAME"] });
        }
    }
    public update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const datasetSourceConfig = new DatasetSourceConfigs(req.body)
            const payload: Record<string, any> = datasetSourceConfig.setValues()
            await findAndSetExistingRecord({ dbConnector: this.dbConnector, table: this.table, request: req, filters: { "id": payload.id }, object: { id: payload.id, type: "datasetSourceConfig" } });
            await this.dbUtil.upsert(req, res, next, payload)
        }
        catch (error: any) {
            console.error(error.message)
            setAuditState("failed", req);
            next({ statusCode: error.status || httpStatus.INTERNAL_SERVER_ERROR, message: error.message, errCode: error.code || httpStatus["500_NAME"] });
        }
    }
    public read = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let status: any = req.query.status || "ACTIVE"
            const id = req.params.datasetId
            await this.dbUtil.read(req, res, next, { id, status })
        }
        catch (error: any) {
            console.error(error.message)
            next({ statusCode: error.status || httpStatus.INTERNAL_SERVER_ERROR, message: error.message, errCode: error.code || httpStatus["500_NAME"] });
        }
    }
    public list = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = req.body
            await this.dbUtil.list(req, res, next, payload)
        }
        catch (error: any) {
            console.error(error.message)
            next({ statusCode: error.status || httpStatus.INTERNAL_SERVER_ERROR, message: error.message, errCode: error.code || httpStatus["500_NAME"] });
        }

    }
}