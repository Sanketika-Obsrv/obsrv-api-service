import { Request, Response, NextFunction } from "express"
import { v4 } from 'uuid';
import _ from 'lodash';
import { config } from "../configs/Config";
import axios from 'axios';

export enum OperationType {
    CREATE = 1,
    UPDATE
}

const getDefaults = () => {
    return {
        eid: 'AUDIT',
        ets: Date.now(),
        ver: '1.0.0',
        mid: v4(),
        actor: {
            id: v4(),
            type: 'User'
        },
        context: {
            env: config.env,
            sid: v4(),
            pdata: {
                id: 'dev.obsrv.console',
                ver: '1.0.0'
            }
        },
        object: {},
        edata: {}
    };
};

const sendTelemetryEvents = async (event: Record<string, any>) => {
    try {
        const payload = { data: { id: v4(), events: [event] } }
        await axios.post(`http://localhost:${config.api_port}/obsrv/v1/data/${config.telemetry_dataset}`, payload, {})
    } catch (error) {
        console.log(error);
    }
}

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

export const setAuditState = (state: string, req: Request) => {
    if (state && req) {
       _.set(req.auditEvent, "toState", state);
    }
}

const setAuditEventType = (operationType: any, request: Request) => {
    switch (operationType) {
        case OperationType.CREATE: {
            request.auditEvent.type = "create";
            break;
        }
        case OperationType.UPDATE: {
            request.auditEvent.type = "update";
            break;
        }
        default:
            break;
    }
}

export const telemetryAuditStart = ({ operationType, action }: any) => {
    return async (request: Request, response: Response, next: NextFunction) => {
        try {
            const body = request.body || {}
            request.auditEvent = getDefaultEdata({ action });
            const props = transformProps(body);
            request.auditEvent.edata.props = props;
            setAuditEventType(operationType, request);
        } catch (error) {
            console.log(error);
        } finally {
            next();
        }
    }
}

export const processTelemetryAuditEvent = () => {
    return (request: Request, response: Response, next: NextFunction) => {
        response.on('finish', () => {
            const auditEvent = _.get(request, 'auditEvent');
            if (auditEvent) {
                const { startEts, object = {}, edata = {}, toState, fromState } = auditEvent;
                const endEts = Date.now();
                const duration = startEts ? (endEts - startEts) : 0;
                auditEvent.edata.transition.duration = duration;
                if (toState && fromState) {
                    auditEvent.edata.transition.toState = toState;
                    auditEvent.edata.transition.fromState = fromState;
                }
                const telemetryEvent = getDefaults();
                telemetryEvent.edata = edata;
                telemetryEvent.object = { ...(object.id && object.type && { ...object, ver: '1.0.0' }) };
                console.log(JSON.stringify(telemetryEvent));
                // sendTelemetryEvents(telemetryEvent);
            }
        })
        next();
    }
}

export const findAndSetExistingRecord = async ({ dbConnector, table, filters, request, object = {} }: Record<string, any>) => {
    const auditEvent = request.auditEvent;
    if (dbConnector && table && filters && _.get(auditEvent, 'type') === "update") {
        try {
            request.auditEvent.object = object;
            const records = await dbConnector.execute("read", { table, fields: { filters } })
            const existingRecord = _.first(records);

            if (existingRecord) {
                const props = _.get(auditEvent, 'edata.props');
                const updatedProps = _.map(props, (prop: Record<string, any>) => {
                    const { property, nv } = prop;
                    const existingValue = _.get(existingRecord, property);
                    return { property, ov: existingValue, nv };
                });
                request.auditEvent.edata.props = updatedProps;
            } else {
                throw new Error();
            }
        } catch (error) {
            setAuditState("failed", request);
            console.log(error);
        }
    }
}
