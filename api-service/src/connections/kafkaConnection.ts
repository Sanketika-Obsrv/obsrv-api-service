import { Kafka } from "kafkajs";
import { connectionConfig } from '../configs/ConnectionsConfig'
import logger from "../logger";

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
      logger.info("Unable to connect to kafka", err.message);
    });
}

export const send = async (payload: Record<string, any>, topic: string) => {
  if (!isConnected) {
    await connect()
  }
  return producer.send({
    topic: topic,
    messages: [{ value: JSON.stringify(payload) }]
  });
}