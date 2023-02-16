import { Kafka, Producer, KafkaConfig } from 'kafkajs'
import { IConnector } from "../models/IngestionModels"

export class KafkaConnector implements IConnector {
    private kafka: Kafka;
    public producer: Producer;
    constructor(config: KafkaConfig) {
        this.kafka = new Kafka(config)
        this.producer = this.kafka.producer({
        })
    }
    async connect() {
       return await this.producer.connect()
    }
    async execute(topic: string, config: any) {
        return await this.producer.send({
            topic: topic,
            messages: [{
                value: config.value
            }]
        })
    }
    async close() {
        return await this.producer.disconnect()
    }
}