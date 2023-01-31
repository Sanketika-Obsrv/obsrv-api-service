import { Kafka, Producer, KafkaConfig } from 'kafkajs'
import { IConnector } from "../models/ingestionModels"

export class KafkaConnector implements IConnector {
    private kafka: Kafka;
    public producer: Producer;
    constructor(config: KafkaConfig) {
        this.kafka = new Kafka(config)
        this.producer = this.kafka.producer({
            allowAutoTopicCreation: false
        })
    }
    connect() {
       return this.producer.connect()
    }
    execute(topic: string, config: any) {
        return this.producer.send({
            topic: topic,
            messages: [{
                value: config.value
            }]
        })
    }
    close() {
        this.producer.disconnect()
    }
}