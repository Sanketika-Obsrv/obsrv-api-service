import { Kafka } from "kafkajs";
import { connectionConfig } from '../configs/ConnectionsConfig'
import logger from "../logger";
import * as _ from "lodash";
import { config } from "../configs/Config";
import { v4 } from "uuid";

const kafka = new Kafka(connectionConfig.kafka.config);
const producer = kafka.producer();

let isConnected = false;

export const connect = async () => {
  await producer.connect()
    .then(() => {
      isConnected = true;
      logger.info("kafka dispatcher is ready");
    })
    .catch((err) => {
      logger.error("Unable to connect to kafka", err?.message);
    });
}

export const send = async (payload: Record<string, any>, topic: string) => {
  if (!isConnected) {
    await connect()
  }

  const now = Date.now();
  _.set(payload, 'syncts', now);
  if (!payload?.mid) _.set(payload, 'mid', v4());
  const source = { meta: { id: "", connector_type: "api", version: config?.version, entry_source: "api" }, trace_id: v4() };
  const obsrvMeta = { syncts: now, processingStartTime: now, flags: {}, timespans: {}, error: {}, source: source };
  _.set(payload, 'obsrv_meta', obsrvMeta);

  return producer.send({
    topic: topic,
    messages: [{ value: JSON.stringify(payload) }]
  });
}
