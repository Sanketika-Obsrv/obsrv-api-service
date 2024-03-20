import { Kafka } from "kafkajs";
import { connectionConfig } from '../configs/ConnectionsConfig'
import logger from "../logger";

const kafka = new Kafka(connectionConfig.kafka.config);
const producer = kafka.producer();

let isConnected = false;

const connect = () => {
  return new Promise(async (resolve, reject) => {
    try {
      await producer.connect()
      logger.info("kafka dispatcher is ready");
      isConnected = true;
      resolve(true);
    } catch (err: any) {
      logger.error("Unable to connect to kafka", err?.message);
      reject(err);
    }
  });
}

const send = (payload: Record<string, any>, topic: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isConnected) {
        await connect();
      }
      const result = await producer.send({
        topic: topic,
        messages: [{ value: JSON.stringify(payload) }]
      });
      resolve(result);
    } catch (error) {
      logger.error("Error sending message to Kafka:", error);
      reject(error);
    }
  });
}

export { connect, send, producer }


// import { Kafka } from "kafkajs";
// import { connectionConfig } from '../configs/ConnectionsConfig';
// import logger from "../logger";

// class KafkaDispatcher {
//   private kafka: Kafka;
//   private producer: any;
//   private isConnected: boolean;

//   constructor() {
//     this.kafka = new Kafka(connectionConfig.kafka.config);
//     this.producer = this.kafka.producer();
//     this.isConnected = false;
//   }

//   // public async connect() {
//   //   // try {
//   //   this.producer.connect().then(() => {
//   //     this.isConnected = true;
//   //     logger.info("kafka dispatcher is ready");
//   //   })
//   //     .catch((err: any) => {
//   //       logger.error("Unable to connect to kafka", err?.message);
//   //     });
//   //   //   this.isConnected = true;
//   //   //   logger.info("kafka dispatcher is ready");
//   //   // } catch (err: any) {
//   //   //   logger.error("Unable to connect to kafka", err?.message);
//   //   // }
//   // }
//   public connect(): Promise<boolean> {
//     return new Promise(async (resolve, reject) => {
//       try {
//         await this.producer.connect();
//         this.isConnected = true;
//         logger.info("kafka dispatcher is ready");
//         resolve(true);
//       } catch (err: any) {
//         logger.error("Unable to connect to kafka", err?.message);
//         reject(err);
//       }
//     });
//   }

//   public async send(payload: Record<string, any>, topic: string) {
//     // if (!this.isConnected) {
//     //   await this.connect();
//     // }
//     // return this.producer.send({
//     //   topic: topic,
//     //   messages: [{ value: JSON.stringify(payload) }]
//     // });
//     return new Promise(async (resolve, reject) => {
//       try {
//         if (!this.isConnected) {
//           await this.connect();
//         }
//         const result = await this.producer.send({
//           topic: topic,
//           messages: [{ value: JSON.stringify(payload) }]
//         });
//         resolve(result);
//       } catch (error) {
//         logger.error("Error sending message to Kafka:", error);
//         reject(error);
//       }
//     });
//   }
// }

// export default KafkaDispatcher;