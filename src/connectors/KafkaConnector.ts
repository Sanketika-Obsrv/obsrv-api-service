import { Kafka, Producer, KafkaConfig } from 'kafkajs'
import { IConnector } from "../models/ingestionModels"

export class KafkaConnector implements IConnector {
    private kafka: Kafka;
    private producer: Producer;
    constructor(config: KafkaConfig) {
        this.kafka = new Kafka(config)
        this.producer = this.kafka.producer({
            allowAutoTopicCreation: false
        })
    }
    async connect(): Promise<any> {
        await this.producer.connect()
            .then(() => {
                console.info("Kafka Connection Established...")
            })
            .catch((err: any) => {
                console.error("Error occured while connecting to kafka...")
            })
    }
    async execute(topic: string, config: any): Promise<any> {
        await this.producer.send({
            topic: topic,
            messages: [{
                value: config.value
            }]
        }).then(() => console.info("Events ingested into kafka successfully..."))

    }
    async close(): Promise<any> {
        await this.producer.disconnect()
        console.log("Kafka disconnected...")
    }
}