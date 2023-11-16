import { IConnector } from "../models/IngestionModels";
const telemetryService = require('../lib/services/TelemetryService')

export class KafkaConnector implements IConnector {
    public telemetryService: any
    constructor() {
        this.telemetryService = telemetryService
    }
    async connect() {
        await telemetryService.health()

    }

    async execute(req: any, res: any, topic: any) {
        await this.telemetryService.dispatch(req, res, topic)
    }

    close() {
        throw new Error("Method not implemented")
    }
}
