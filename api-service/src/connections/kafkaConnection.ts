import { Kafka } from "kafkajs";
import { connectionConfig } from '../configs/ConnectionsConfig'
import logger from "../logger";
import { CompressionTypes, CompressionCodecs } from "kafkajs";
import { SnappyCodec } from "kafkajs-snappy-typescript";
const kafka = new Kafka(connectionConfig.kafka.config);
const producer = kafka.producer();
CompressionCodecs[CompressionTypes.Snappy] = new SnappyCodec().codec;

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
      acks: -1, //do not change
      compression: CompressionTypes.Snappy,
      messages: [{ value: JSON.stringify(payload) }]
    });
    return result;
  } catch (error) {
    logger.error("Error sending message to Kafka:", error);
    throw error;
  }
}

export { connect, send }
