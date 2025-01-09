import { Counter, diag, DiagConsoleLogger, DiagLogLevel, Meter, metrics } from '@opentelemetry/api';
import * as logsAPI from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import logger from '../../logger';
import * as _ from "lodash";
import { config } from "../../configs/Config";
const collectorEndpoint = _.get(config, "otel.collector_endpoint", "http://localhost:4318");

export class OTelService {
    private static meterProvider: MeterProvider;
    private static loggerProvider: LoggerProvider;
    private static tracerProvider: NodeTracerProvider;

    public static init() {
        this.tracerProvider = this.createTracerProvider(collectorEndpoint);
        this.meterProvider = this.createMeterProvider(collectorEndpoint);
        this.loggerProvider = this.createLoggerProvider(collectorEndpoint);

        // Register the global tracer, meter, and logger providers
        this.tracerProvider.register();
        this.setGlobalMeterProvider(this.meterProvider);

        logger.info("OpenTelemetry Service Initialized");

        // Add shutdown hook
        process.on('SIGTERM', async () => {
            await this.tracerProvider.shutdown();
            await this.meterProvider.shutdown();
            await this.loggerProvider.shutdown();
        });
    }

    private static createTracerProvider(endpoint: string) {
        const traceExporter = new OTLPTraceExporter({
            url: `${endpoint}/v1/traces`,
        });

        const tracerProvider = new NodeTracerProvider({
            resource: this.createServiceResource('obsrv-api-service'),
        });

        tracerProvider.addSpanProcessor(new BatchSpanProcessor(traceExporter));

        return tracerProvider;
    }

    private static createMeterProvider(endpoint: string) {
        const metricExporter = new OTLPMetricExporter({
            url: `${endpoint}/v1/metrics`,
        });

        const meterProvider = new MeterProvider({
            resource: this.createServiceResource('obsrv-api-service'),
        });

        meterProvider.addMetricReader(
            new PeriodicExportingMetricReader({
                exporter: metricExporter,
                exportIntervalMillis: 10000,
            })
        );

        return meterProvider;
    }

    private static createLoggerProvider(endpoint: string) {
        const logExporter = new OTLPLogExporter({
            url: `${endpoint}/v1/logs`,
        });

        const loggerProvider = new LoggerProvider({
            resource: this.createServiceResource('obsrv-api-service'),
        });

        loggerProvider.addLogRecordProcessor(
            new BatchLogRecordProcessor(logExporter)
        );

        return loggerProvider;
    }

    // Helper method to create a Resource with service name
    private static createServiceResource(serviceName: string) {
        return new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        });
    }

    private static setGlobalMeterProvider(meterProvider: MeterProvider) {
        diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
        diag.info('Registering MeterProvider globally.');
        metrics.setGlobalMeterProvider(meterProvider);
    }

    // Method to create a counter metric
    public static createCounterMetric(name: string): Counter {
        const meter = this.getMeterProvider(); // Use the updated getMeterProvider method
        const counter = meter.createCounter(name, {
            description: 'Counts the number of API calls',
        });
        return counter;
    }

    public static getMeterProvider(): Meter {
        return this.meterProvider.getMeter('obsrv-api-service');
    }

    public static getLoggerProvider(): LoggerProvider {
        return this.loggerProvider;
    }

    public static getTracerProvider(): NodeTracerProvider {
        return this.tracerProvider;
    }

    // Method to record the counter metric
    public static recordCounter(counter: Counter, value: number) {
        counter.add(value, {
            service: 'obsrv-api-service',
        });
    }


    public static generateOTelLog(auditLog: Record<string, any>, severity: 'INFO' | 'WARN' | 'ERROR', logType?: string) {
        if((config.otel && _.toLower(config?.otel?.enable) === "true")){
            const loggerInstance = this.loggerProvider.getLogger('obsrv-api-service');
        
            const severityMapping: Record<string, number> = {
                INFO: logsAPI.SeverityNumber.INFO,
                WARN: logsAPI.SeverityNumber.WARN,
                ERROR: logsAPI.SeverityNumber.ERROR,
            };
        
            const severityNumber = severityMapping[severity] || logsAPI.SeverityNumber.INFO; 
        
            const logRecord = {
                severityNumber,
                severityText: severity,
                body: JSON.stringify(auditLog),
                attributes: {
                    'log.type': logType || 'console',
                    ...auditLog,
                },
            };
            loggerInstance.emit(logRecord);
        }
    }
        
    
}
