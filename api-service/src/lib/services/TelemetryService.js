const uuidv1 = require("uuid/v1"),
  // request = require("request"),
  DispatcherClass = require("../dispatcher/dispatcher").Dispatcher;
const axios = require('axios').default;
const config = require("../../configs/Config").config;
const responseHandler = require("../../helpers/ResponseHandler").ResponseHandler;

// TODO: Make this efficient. Implementation to be similar to typesafe config. Right now one configuration holds
// together all supported transport configurations

class TelemetryService {
  constructor(Dispatcher, config) {
    this.config = config;
    this.dispatcher = this.config.localStorageEnabled === "true" ? new Dispatcher(config) : undefined;
  }
  dispatch(req, res, ...params) {
    const message = req.body;
    message.did = req.get("x-device-id");
    message.channel = req.get("x-channel-id");
    message.pid = req.get("x-app-id");
    if (!message.mid) message.mid = uuidv1();
    message.syncts = new Date().getTime();
    
    // add obsrv meta
    const source = {meta: {id: "", connector_type: "api", version: config.version, entry_source: "api"}, trace_id: uuidv1()};
    const obsrvMeta = {syncts: new Date().getTime(), processingStartTime: new Date().getTime(), flags: {}, timespans: {}, error: {}, source: source};
    message.obsrv_meta = obsrvMeta;

    const data = JSON.stringify(message);
    if (this.config.localStorageEnabled === "true" || this.config.telemetryProxyEnabled === "true") {
      if (this.config.localStorageEnabled === "true" && this.config.telemetryProxyEnabled !== "true") {
        // Store locally and respond back with proper status code
        // this.dispatcher.dispatch(message.mid, data, this.getRequestCallBack(req, res));
        return new Promise(async (resolve, reject) => {
          await this.dispatcher.dispatch(message.mid, data, params, (err, response) => {
            if (err) {
              return reject(err);
            } else {
              return resolve(response);
            }
          });
        });
      } else if (this.config.localStorageEnabled === "true" && this.config.telemetryProxyEnabled === "true") {
        // Store locally and proxy to the specified URL. If the proxy fails ignore the error as the local storage is successful. Do a sync later
        const options = this.getProxyRequestObj(req, data);
        // request.post(options, (err, data) => {
        //   if (err) console.error("Proxy failed:", err);
        //   else console.log("Proxy successful!  Server responded with:", data.body);
        // });
        // this.dispatcher.dispatch(message.mid, data, this.getRequestCallBack(req, res));
        axios.post(options.url, options.body, {
          headers: options.headers,
        }).then((response) => {
          console.log("Proxy successful!  Server responded with:", data.body);
          this.dispatcher.dispatch(message.mid, data, () => {});
          this.sendSuccess(req, res, { message: "the data has been successfully ingested" });
        }).catch((err) => {
          console.error("Proxy failed:", err);
          this.dispatcher.dispatch(message.mid, data, () => {});
          this.sendError(req, res, { message: err.message });
        });
      } else if (this.config.localStorageEnabled !== "true" && this.config.telemetryProxyEnabled === "true") {
        // Just proxy
        const options = this.getProxyRequestObj(req, data);
        axios.post(options.url, options.body, {
          headers: options.headers,
        }).then(
          this.sendSuccess(req, res, { message: "the data has been successfully ingested" })
        ).catch((err) => 
          this.sendError(req, res, { message: err.message })
        )
        // request.post(options, this.getRequestCallBack(req, res));
      }
    } else {
      this.sendError(req, res, { message: "Configuration error" });
    }
  }
  health(req, res) {
    if (this.config.localStorageEnabled === "true") {
      return new Promise(async (resolve, reject) => {
        await this.dispatcher.health((err, response) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(response);
          }
        });
      });
    } else if (this.config.telemetryProxyEnabled === "true") {
      this.sendSuccess(req, res, { message: "Telemetry Proxy enabled" });
    } else {
      this.sendError(req, res, { message: "Configuration error" });
    }
  }
  getRequestCallBack(req, res) {
    let counter = 0;
    return (err, data) => {
      counter++;
      if (counter > 1) return;
      if (err) {
        this.sendError(req, res, { message: err.message });
      } else {
        this.sendSuccess(req, res, { message: "the data has been successfully ingested" });
      }
    };
  }
  sendError(req, res, options) {
    responseHandler.errorResponse({ statusCode: 500, message: options.message, errCode: ["INTERNAL_SERVER_ERROR"] }, req, res);
  }
  sendSuccess(req, res, options) {
    responseHandler.successResponse(req, res, { message: options.message });
  }
  getProxyRequestObj(req, data) {
    const headers = { authorization: "Bearer " + config.proxyAuthKey };
    if (req.get("content-type")) headers["content-type"] = req.get("content-type");
    if (req.get("content-encoding")) headers["content-encoding"] = req.get("content-encoding");
    return {
      url: this.config.proxyURL,
      headers: headers,
      body: data,
    };
  }
}
module.exports = new TelemetryService(DispatcherClass, config.telemetry_service_config);
