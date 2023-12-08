import { Request, Response, NextFunction } from "express";
import _ from 'lodash'
import { ErrorResponseHandler } from "../helpers/ErrorResponseHandler";
import { ingestorService } from "../routes/Router";
import { IngestorService } from "./IngestorService";
import constants from "../resources/Constants.json"
import { DatasetStatus, IConnector } from "../models/DatasetModels";
import { ResponseHandler } from "../helpers/ResponseHandler";
import { WrapperService } from "./WrapperService";
import { HTTPConnector } from "../connectors/HttpConnector";
import { config } from "../configs/Config";
import { AxiosInstance } from "axios";
export class RetireService {
    private dbConnector: IConnector;
    private errorHandler: ErrorResponseHandler;
    private ingestorService: IngestorService;
    private wrapperService: WrapperService;
    private httpService: AxiosInstance;
    constructor(dbConnector: IConnector,) {
        this.dbConnector = dbConnector
        this.ingestorService = ingestorService;
        this.errorHandler = new ErrorResponseHandler("RetireService");
        this.wrapperService = new WrapperService();
        this.httpService =  new HTTPConnector(`${config.command_service_config.host}:${config.command_service_config.port}`).connect();
    }

    public retireDataset = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { datasetId } = req.params;
            const datasetRecord = await this.datasetExists(datasetId);
            if (!datasetRecord) throw constants.DATASET_NOT_FOUND;
            const queries = [
                `UPDATE dataset_source_config SET status = '${DatasetStatus.Retired}' WHERE dataset_id = '${datasetRecord.id}' AND status = '${DatasetStatus.Live}'`,
                `UPDATE datasources SET status = '${DatasetStatus.Retired}' WHERE dataset_id = '${datasetRecord.id}' AND status = '${DatasetStatus.Live}'`,
                `UPDATE datasets SET status = '${DatasetStatus.Retired}' WHERE id = '${datasetRecord.id}' AND status = '${DatasetStatus.Live}'`,
            ];
            await this.dbConnector.executeSql(queries);
            await this.httpService.post(`${config.command_service_config.path}`, { command: `RESTART_PIPELINE` });
            let datasourceRefs = await this.dbConnector.executeSql([`SELECT * FROM datasources WHERE dataset_id = '${datasetRecord.id}' AND status = '${DatasetStatus.Retired}'`]);
            datasourceRefs = _.map(_.get(_.first(datasourceRefs), 'rows', []), 'datasource_ref');
            for (let datasourceRef of datasourceRefs) {
                await this.wrapperService.deleteSupervisor(datasourceRef);
            }
            ResponseHandler.successResponse(req, res, { status: 200, data: Object.assign({ message: constants.CONFIG.DATASET_RETIRED }) });
        } catch (error: any) { this.errorHandler.handleError(req, res, next, error) }
    }

    public datasetExists = async (datasetId: string) => {
        return this.ingestorService.getDatasetConfig(datasetId)
    }
}
