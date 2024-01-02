import { Request, Response, NextFunction } from "express"
import { v4 } from 'uuid';
import _ from 'lodash';
import { config as appConfig } from "../configs/Config";
import { Kafka } from 'kafkajs';

const env = _.get(appConfig, 'env')
const telemetryTopic = _.get(appConfig, 'telemetry_dataset');
const brokerServers = _.get(appConfig, 'telemetry_service_config.kafka.config.brokers');

export enum OperationType { CREATE = 1, UPDATE, PUBLISH, RETIRE, LIST, GET }

const kafka = new Kafka({ clientId: telemetryTopic, brokers: brokerServers });
const telemetryEventsProducer = kafka.producer();
telemetryEventsProducer.connect().catch(err => console.error("Unable to connect to kafka", err.message));

const getDefaults = () => {
    return {
        eid: 'AUDIT',
        ets: Date.now(),
        ver: '1.0.0',
        mid: v4(),
        actor: {
            id: "SYSTEM",
            type: 'User'
        },
        context: {
            env,
            sid: v4(),
            pdata: {
                id: `${env}.api.service`,
                ver: '1.0.0'
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
    telemetryEventsProducer.send({ topic: telemetryTopic, messages: [{ value: JSON.stringify(event) }] }).catch(console.log)
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
            _.set(request, 'auditEvent.type', 'create');
            break;
        }
        case OperationType.UPDATE: {
            _.set(request, 'auditEvent.type', 'update');
            break;
        }
        case OperationType.PUBLISH: {
            _.set(request, 'auditEvent.type', 'publish');
            break;
        }
        case OperationType.RETIRE: {
            _.set(request, 'auditEvent.type', 'retire');
            break;
        }
        case OperationType.LIST: {
            _.set(request, 'auditEvent.type', 'list');
            break;
        }
        case OperationType.GET: {
            _.set(request, 'auditEvent.type', 'get');
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
            _.set(request, 'auditEvent.edata.props', props);
            setAuditEventType(operationType, request);
        } catch (error) {
            console.log(error);
        } finally {
            next();
        }
    }
}

export const processAuditEvents = (request: Request, response: Response) => {
    const auditEvent: any = _.get(request, 'auditEvent');
    if (auditEvent) {
        const { startEts, object = {}, edata = {}, toState, fromState }: any = auditEvent;
        const endEts = Date.now();
        const duration = startEts ? (endEts - startEts) : 0;
        _.set(auditEvent, 'edata.transition.duration', duration);
        if (toState && fromState) {
            _.set(auditEvent, 'edata.transition.toState', toState);
            _.set(auditEvent, 'edata.transition.fromState', fromState);
        }
        const telemetryEvent = getDefaults();
        _.set(telemetryEvent, 'edata', edata);
        _.set(telemetryEvent, 'object', { ...(object.id && object.type && { ...object, ver: '1.0.0' }) });
        sendTelemetryEvents(telemetryEvent);
    }
}

export const interceptAuditEvents = () => {
    return (request: Request, response: Response, next: NextFunction) => {
        response.on('finish', () => {
            const statusCode = _.get(response, 'statusCode');
            const isError = statusCode && statusCode >= 400;
            !isError && processAuditEvents(request, response);
        })
        next();
    }
}

export const updateTelemetryAuditEvent = ({ currentRecord, request, object = {} }: Record<string, any>) => {
    const auditEvent = request?.auditEvent;
    _.set(request, 'auditEvent.object', object);
    if (currentRecord) {
        const props = _.get(auditEvent, 'edata.props');
        const updatedProps = _.map(props, (prop: Record<string, any>) => {
            const { property, nv } = prop;
            const existingValue = _.get(currentRecord, property);
            return { property, ov: existingValue, nv };
        });
        _.set(request, 'auditEvent.edata.props', updatedProps);
    }
}

export const findAndSetExistingRecord = async ({ dbConnector, table, filters, request, object = {} }: Record<string, any>) => {
    const auditEvent = request?.auditEvent;
    if (dbConnector && table && filters && _.get(auditEvent, 'type') === "update") {
        try {
            _.set(request, 'auditEvent.object', object);
            const records = await dbConnector.execute("read", { table, fields: { filters } })
            const existingRecord = _.first(records);
            if (existingRecord) {
                const props = _.get(auditEvent, 'edata.props');
                const updatedProps = _.map(props, (prop: Record<string, any>) => {
                    const { property, nv } = prop;
                    const existingValue = _.get(existingRecord, property);
                    return { property, ov: existingValue, nv };
                });
                _.set(request, 'auditEvent.edata.props', updatedProps);
            }
        } catch (error) {
            setAuditState("failed", request);
        }
    }
}
