import { Kafka } from "kafkajs";
import { connectionConfig } from '../configs/ConnectionsConfig'

const kafka = new Kafka(connectionConfig.kafka.config);
const producer = kafka.producer();

export const connect = async () => {
  await producer.connect()
    .then(() => {
      console.log("kafka dispatcher is ready");
    })
    .catch((err) => {
      console.error("Unable to connect to kafka", err.message);
    });
}

export const send = async (payload: Record<string, any>, topic: string) => {
  await connect();
  return producer.send({
      topic: topic,
      messages: [{ value: JSON.stringify(payload) }]
  });
}