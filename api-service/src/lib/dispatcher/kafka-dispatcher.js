const winston = require("winston");
const { Kafka } = require("kafkajs");
const _ = require("lodash");

class KafkaDispatcher extends winston.Transport {
  constructor(options) {
    super();
    this.name = "kafka";
    this.options = options.kafka;
    if (this.options.compression_type == "snappy") {
      this.compression_attribute = 2;
    } else if (this.options.compression_type == "gzip") {
      this.compression_attribute = 1;
    } else {
      this.compression_attribute = 0;
    }
    this.client = new Kafka(this.options.config);
    this.producer = this.client.producer();
    this.init();
  }
  async init() {
    await this.producer
      .connect()
      .then(() => {
        console.log("kafka dispatcher is ready");
      })
      .catch((err) => {
        console.error("Unable to connect to kafka", err.message);
      });
  }
  async log(level, msg, kafkaTopics, callback) {
    try {
      console.log(`pushing events to topic '${kafkaTopics[0]}'...`);
      await this.producer.send({
        topic: kafkaTopics[0],
        messages: [{ value: msg }],
      });
      callback(null, true);
    } catch (err) {
      console.log(err);
      callback(err);
    }
  }

  async health(callback) {
    try {
      const admin = this.client.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();
      callback(null, true);
    } catch (error) {
      callback(error);
    }
  }
}

winston.transports.Kafka = KafkaDispatcher;

module.exports = { KafkaDispatcher };
