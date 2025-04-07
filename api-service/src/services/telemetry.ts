import { Request, Response, NextFunction, response } from "express"
import { v4 } from "uuid";
import _ from "lodash";
import { config as appConfig } from "../configs/Config";
import {send} from "../connections/kafkaConnection"
import { OTelService } from "./otel/OTelService";
import { Parser } from "node-sql-parser";
import { datasetService } from "./DatasetService";

const {env, version} = _.pick(appConfig, ["env","version"])
const telemetryTopic = _.get(appConfig, "telemetry_dataset");
const parser = new Parser();
const dataset_id = new Map();

export enum OperationType { CREATE = 1, UPDATE, PUBLISH, RETIRE, LIST, GET }


const getDefaults = (userID:any) => {
    return {
        eid: "AUDIT",
        ets: Date.now(),
        ver: "1.0.0",
        mid: v4(),
        actor: {
            id: userID || "SYSTEM",
            type: "User",
        },
        context: {
            env,
            sid: v4(),
            pdata: {
                id: `${env}.api.service`,
                ver: `${version}`
            }
        },
        object: {},
        edata: {}
    };
};

const getDefaultEdata = ({ action }: any) => ({
    startEts: Date.now(),
    type: null,
    object: {},
    fromState: "inprogress",
    toState: "completed",
    edata: {
        action,
        props: [],
        transition: {
            timeUnit: "ms",
            duration: 0
        }
    }
})

const sendTelemetryEvents = async (event: Record<string, any>) => {
    OTelService.generateOTelLog(event, 'INFO', 'audit-log');
    send(event, telemetryTopic).catch(console.log);
}

const transformProps = (body: Record<string, any>) => {
    return _.map(_.entries(body), (payload) => {
        const [key, value] = payload;
        return {
            property: key,
            ov: null,
            nv: value
        }
    })
}

export const setAuditState = (state: string, req: any) => {
    if (state && req) {
        _.set(req.auditEvent, "toState", state);
    }
}

const setAuditEventType = (operationType: any, request: any) => {
    switch (operationType) {
        case OperationType.CREATE: {
            _.set(request, "auditEvent.type", "create");
            break;
        }
        case OperationType.UPDATE: {
            _.set(request, "auditEvent.type", "update");
            break;
        }
        case OperationType.PUBLISH: {
            _.set(request, "auditEvent.type", "publish");
            break;
        }
        case OperationType.RETIRE: {
            _.set(request, "auditEvent.type", "retire");
            break;
        }
        case OperationType.LIST: {
            _.set(request, "auditEvent.type", "list");
            break;
        }
        case OperationType.GET: {
            _.set(request, "auditEvent.type", "get");
            break;
        }
        default:
            break;
    }
}

export const telemetryAuditStart = ({ operationType, action }: any) => {
    return async (request: any, response: Response, next: NextFunction) => {
        try {
            const body = request.body || {};
            request.auditEvent = getDefaultEdata({ action });
            const props = transformProps(body);
            _.set(request, "auditEvent.edata.props", props);
            setAuditEventType(operationType, request);
        } catch (error) {
            console.log(error);
        } finally {
            next();
        }
    }
}

export const processAuditEvents = (request: Request) => {
    const auditEvent: any = _.get(request, "auditEvent");
    if (auditEvent) {
        const { startEts, object = {}, edata = {}, toState, fromState }: any = auditEvent;
        const endEts = Date.now();
        const duration = startEts ? (endEts - startEts) : 0;
        _.set(auditEvent, "edata.transition.duration", duration);
        if (toState && fromState) {
            _.set(auditEvent, "edata.transition.toState", toState);
            _.set(auditEvent, "edata.transition.fromState", fromState);
        }
        console.log((request as any)?.userID)
        console.log("request:",request);
        const telemetryEvent = getDefaults((request as any)?.userID);
        _.set(telemetryEvent, "edata", edata);
        _.set(telemetryEvent, "object", { ...(object.id && object.type && { ...object, ver: "1.0.0" }) });
        sendTelemetryEvents(telemetryEvent);
    }
}

export const interceptAuditEvents = () => {
    return (request: Request, response: Response, next: NextFunction) => {
        response.on("finish", () => {
            const statusCode = _.get(response, "statusCode");
            const isError = statusCode && statusCode >= 400;
            !isError && processAuditEvents(request);
        })
        next();
    }
}

export const updateTelemetryAuditEvent = ({ currentRecord, request, object = {} }: Record<string, any>) => {
    const auditEvent = request?.auditEvent;
    _.set(request, "auditEvent.object", object);
    if (currentRecord) {
        const props = _.get(auditEvent, "edata.props");
        const updatedProps = _.map(props, (prop: Record<string, any>) => {
            const { property, nv } = prop;
            const existingValue = _.get(currentRecord, property);
            return { property, ov: existingValue, nv };
        });
        _.set(request, "auditEvent.edata.props", updatedProps);
    }
}

export const findAndSetExistingRecord = async ({ dbConnector, table, filters, request, object = {} }: Record<string, any>) => {
    const auditEvent = request?.auditEvent;
    if (dbConnector && table && filters && _.get(auditEvent, "type") === "update") {
        try {
            _.set(request, "auditEvent.object", object);
            const records = await dbConnector.execute("read", { table, fields: { filters } })
            const existingRecord = _.first(records);
            if (existingRecord) {
                const props = _.get(auditEvent, "edata.props");
                const updatedProps = _.map(props, (prop: Record<string, any>) => {
                    const { property, nv } = prop;
                    const existingValue = _.get(existingRecord, property);
                    return { property, ov: existingValue, nv };
                });
                _.set(request, "auditEvent.edata.props", updatedProps);
            }
        } catch (error) {
            setAuditState("failed", request);
        }
    }
}

export const getDefaultLog = (actionType: any, userID: any ) => {
    return {
        eid: "LOG",
        ets: Date.now(),
        ver: "1.0.0",
        mid: v4(),
        actor: {
            id: userID,
            type: "User"
        },
        context:{
            pdata:{
                id : `${env}.api.service`,
                ver: `${version}`
            }
        },
        sid: v4(),
        edata:{}
    }
} 

const setLogEventType = (operationType: any, request: any) => {
    switch (operationType) {
        case OperationType.CREATE: {
            _.set(request, "logEvent.type", "create");
            break;
        }
        case OperationType.LIST: {
            _.set(request, "logEvent.type", "list");
            break;
        }
        case OperationType.GET: {
            _.set(request, "logEvent.type", "get");
            break;
        }
        default:
            break;
    }
}

export const telemetryLogStart = ({ operationType, action }: any) =>{
    return async ( request: any, response: Response, next: NextFunction) => {
        try{
            const user_id = (request as any)?.userID
            request.logEvent = getDefaultLog(action, user_id);
            setLogEventType( operationType, request);
        } catch (error) {
            console.log(error)
        } finally {
            next();
        }
    }
}

export const getTable = (tables: any) => {
    const table = _.map(tables , data=> data.table);
    return table[0];
}

export const getColumn = (columns: any) => {
    const column = _.map(columns, data => data.expr.column)
    return column.filter(value => value !== undefined);
}

export const getFilters = (whereClause: any) => {
    const conditions: any = [];
    _.cloneDeepWith(whereClause, (obj) => {
        if (obj && obj.type === 'binary_expr') {
            const data = {
                column: obj.left.column || obj.left.value,
                value: getFilterValue(obj.right.value),
                operator: obj.operator
            }
            if(obj.left.column || obj.left.value) {
                conditions.push(data);
            }
        }
    });
    return conditions;
}

export const getFilterValue = (data: any) => {
    let values = _.map(data, value => value.value);
    if (values.filter(Boolean).length != 0) {
        return values;
    }
    return data;

}

export const getMetrics = (columns: any) => {
    const metrics: any = [];
    _.map(columns, data => {
        if(! data.expr.args?.expr) return;
        metrics.push({
            name: data.expr.name,
            column: data.expr.args.expr.column || data.expr.args.expr.value
        })
    });
    return metrics;
}

export const getDatasetId = async (data: any) => {
    try{
        if (_.get(dataset_id, "id") == data) {
            return _.get(dataset_id, "id");
        }
        else {
            const tableRecord: any = await datasetService.getDatasetIdWithDatasource(data, ["dataset_id"]);
            _.set(dataset_id, "id", tableRecord.dataset_id);
            return tableRecord.dataset_id;
        }
    }
    catch (error) {
        console.log(error);
    }
}

export const setLogEdata =  async (logEvent: any,request: Request, response: Response) => {
    try{
        const {edata = {}}: any = logEvent;
        const userID = (request as any)?.userID || "SYSTEM";
        const telemetryLogEvent = getDefaultLog(edata.action,userID);
        const query = request.body?.query || request.body.querySql?.query || null;
        const ast = parser.astify(query);
        const table = getTable(_.get(ast, "from"));
        _.set(telemetryLogEvent, "edata", edata);
        const dataset_id = await getDatasetId(table);
        _.set(telemetryLogEvent, "edata.dataset_id", dataset_id);
        _.set(telemetryLogEvent, "edata.query_metadata.table", table);
        const columns: any = _.get(ast, "columns");
        _.set(telemetryLogEvent, "edata.query_metadata.dimensions",getColumn(columns));
        _.set(telemetryLogEvent, "edata.query_metadata.metrics", getMetrics(columns) || []);
        _.set(telemetryLogEvent, "edata.query_metadata.filters", getFilters(_.get(ast, "where")));
        _.set(telemetryLogEvent, "edata.query_metadata.response.size", (response.getHeaders()["content-length"]))
        _.set(telemetryLogEvent, "edata.query_metadata.response.duration", Date.now() - logEvent.ets)
        
        return telemetryLogEvent
    }
    catch (error) {
        console.log(error);
    }
}

export const processLogEvents = async (request: Request, response: Response) => {
    const logEvent = _.get(request, "logEvent") || {};
    const telemetryLogEvent: any = await setLogEdata(logEvent, request, response);
    sendTelemetryEvents(telemetryLogEvent);
}

export const interceptLogEvents = () => {
    return (request: Request, response: Response, next: NextFunction) => {
        response.on("finish", () => {
                _.get(request, "logEvent") && processLogEvents(request, response);
        })
        next();
    }
}