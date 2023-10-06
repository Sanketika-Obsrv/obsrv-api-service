const envVariables = {
    level: process.env.telemetry_log_level || 'info',
    localStorageEnabled: process.env.telemetry_local_storage_enabled || 'true',
    dispatcher: process.env.telemetry_local_storage_type || 'kafka',
    telemetryProxyEnabled: process.env.telemetry_proxy_enabled,
    proxyURL: process.env.telemetry_proxy_url,
    proxyAuthKey: process.env.telemetry_proxy_auth_key,
    kafkaHost: `${process.env.kafka_host || 'localhost'}:${process.env.kafka_port || 9092}`,
    topic:  `${process.env.system_env || 'local'}.ingest`,
    compression_type: process.env.telemetry_kafka_compression || 'none',
    filename: process.env.telemetry_file_filename || 'telemetry-%DATE%.log',
    maxsize: process.env.telemetry_file_maxsize || 10485760,
    maxFiles: process.env.telemetry_file_maxfiles || '100',
}
module.exports = envVariables;