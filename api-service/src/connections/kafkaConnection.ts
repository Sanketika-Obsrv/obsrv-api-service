import { Kafka } from "kafkajs";
import { connectionConfig } from '../configs/ConnectionsConfig'
import logger from "../logger";

const kafka = new Kafka(connectionConfig.kafka.config);
const producer = kafka.producer();

let isConnected = false;

const connect = async () => {
  try {
    await producer.connect();
    logger.info("kafka dispatcher is ready");
    isConnected = true;
    return true;
  } catch (err: any) {
    logger.error("Unable to connect to kafka", err?.message);
    throw err;
  }
}

const send = async (payload: Record<string, any>, topic: string) => {
  try {
    if (!isConnected) {
      await connect();
    }
    const result = await producer.send({
      topic: topic,
      messages: [{ value: JSON.stringify(payload) }]
    });
    return result;
  } catch (error) {
    logger.error("Error sending message to Kafka:", error);
    throw error;
  }
}

export { connect, send, producer }
