const winston = require("winston");
const { KafkaDispatcher } = require("./kafka-dispatcher");
require("winston-daily-rotate-file");
require("./kafka-dispatcher");
const appConfig = require("../../configs/Config")
const defaultFileOptions = {
  filename: "dispatcher-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxsize: appConfig.config.telemetry_service_config.maxsize,
  maxFiles: "100",
  zippedArchive: true,
  json: true,
};


class Dispatcher {
  constructor(options) {
    if (!options) throw new Error("Dispatcher options are required");
    this.logger = new winston.Logger({ level: "info" });
    this.options = options;
    this.kafkaDispatcher = new KafkaDispatcher(this.options)
    if (this.options.dispatcher == "kafka") {
      this.logger.add(winston.transports.Kafka, this.options);
      console.log("Kafka transport enabled !!!");
    } else if (this.options.dispatcher == "file") {
      const config = Object.assign(defaultFileOptions, this.options);
      this.logger.add(winston.transports.DailyRotateFile, config);
      console.log("File transport enabled !!!");
    } else {
      // Log to console
      this.options.dispatcher = "console";
      const config = Object.assign({ json: true, stringify: (obj) => JSON.stringify(obj) }, this.options);
      this.logger.add(winston.transports.Console, config);
      console.log("Console transport enabled !!!");
    }
  }

  dispatch(mid, message, params, callback) {
    // this.logger.log("info", message, params, callback)
    this.kafkaDispatcher.log("info", message, params, callback);
  }

  health(callback) {
    if (this.options.dispatcher === "kafka") {
      this.logger.transports["kafka"].health(callback);
    } else if (this.options.dispatcher === "console") {
      callback(null, true);
    } else {
      callback("telemetry service is not healthy");
    }
  }
}

module.exports = { Dispatcher };
