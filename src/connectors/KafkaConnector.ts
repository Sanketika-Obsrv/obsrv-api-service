const { Kafka } = require('kafkajs')
import { IConnector } from "../models/ingestionModels"


export class KafkaConnector implements IConnector {
    private url: string[];
    private kafka: typeof Kafka;
    private producer: any
    constructor(url: string[]) {
        this.url = url;
        this.kafka = new Kafka({
            clientId: 'obsrv',
            brokers: this.url,
            retry: {
                initialRetryTime: 500,
                retries: 3
            },
        })
        this.producer = this.kafka.producer()
    }

    async connect() {
        await this.producer.connect()
            .then(() => {
                console.info("Kafka Connection Established...")
            })
            .catch((err: any) => {
                throw new Error(err)
            })
    }
    async execute(sample: string, topic: string) {
        await this.producer.send({
            topic: topic,
            messages: [
                { value: sample },
            ],
        }).then(() => console.info("Events ingested into kafka successfully..."))
            .catch((err: any) => {
                throw new Error(err)
            })
    }
    async close() {
        await this.producer.disconnect()
        console.log("Kafka disconnected...")
    }
}