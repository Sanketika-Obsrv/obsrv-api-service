import app from "../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { TestDataIngestion, TestSubmitIngestion } from "./Fixtures";
import { config } from "./Config";
import { routesConfig } from "../configs/RoutesConfig";
import constants from "../resources/Constants.json"
import { dbConnector, globalCache, ingestorService, kafkaConnector } from "../routes/Router";
import { describe, it } from 'mocha';
import nock from "nock";
import { DatasetStatus } from "../models/DatasetModels";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("DATA INGEST API", () => {
    afterEach(() => {
        chai.spy.restore()
    })

    it("it should ingest data successfully", (done) => {
        chai.spy.on(dbConnector, "listRecords", () => {
            return Promise.resolve([ {} ])
        })
        chai.spy.on(globalCache, 'get', () => {
            return [ { "id": ":datasetId", "status": DatasetStatus.Live, "dataset_config": { "entry_topic": "topic" }, "extraction_config": { "is_batch_event": true, "extraction_key": "events", "batch_id": "id" } } ]
        })
        chai.spy.on(kafkaConnector.telemetryService, "dispatch", () => {
            return Promise.resolve("data ingested")
        })
        chai
            .request(app)
            .post(config.apiDatasetIngestEndPoint)
            .send(TestDataIngestion.SAMPLE_INPUT)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus[ "200_NAME" ]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routesConfig.data_ingest.api_id);
                res.body.params.status.should.be.eq(constants.STATUS.SUCCESS)
                chai.spy.restore(dbConnector, "listRecords")
                chai.spy.restore(globalCache, 'get')
                chai.spy.restore(kafkaConnector.telemetryService, "dispatch")
                done()
            })
    });
    it("it should ingest data successfully for batch even for individual events", (done) => {
        chai.spy.on(dbConnector, "listRecords", () => {
            return Promise.resolve([ {} ])
        })
        chai.spy.on(globalCache, 'get', () => {
            return [ { "id": ":datasetId", "status": DatasetStatus.Live, "dataset_config": { "entry_topic": "topic" }, "extraction_config": { "is_batch_event": true, "extraction_key": "events", "batch_id": "id" } } ]
        })
        chai.spy.on(kafkaConnector.telemetryService, "dispatch", () => {
            return Promise.resolve("data ingested")
        })
        chai
            .request(app)
            .post(config.apiDatasetIngestEndPoint)
            .send(TestDataIngestion.SAMPLE_INDIVIDUAL_EVENT)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus[ "200_NAME" ]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routesConfig.data_ingest.api_id);
                res.body.params.status.should.be.eq(constants.STATUS.SUCCESS)
                chai.spy.restore(dbConnector, "listRecords")
                chai.spy.restore(globalCache, 'get')
                chai.spy.restore(kafkaConnector.telemetryService, "dispatch")
                done()
            })
    });
    it("it should not ingest data successfully when kafka is unable to connect", (done) => {
        chai.spy.on(dbConnector, "listRecords", () => {
            return Promise.resolve([ {} ])
        })
        chai.spy.on(globalCache, 'get', () => {
            return [ { "id": ":datasetId", "status": DatasetStatus.Live, "dataset_config": { "entry_topic": "topic" } } ]
        })
        chai.spy.on(kafkaConnector.telemetryService, "dispatch", () => {
            return Promise.reject("error connecting to kafka")
        })
        chai
            .request(app)
            .post(config.apiDatasetIngestEndPoint)
            .send(TestDataIngestion.SAMPLE_INPUT)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus[ "400_NAME" ]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routesConfig.data_ingest.api_id);
                res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                chai.spy.restore(dbConnector, "listRecords")
                chai.spy.restore(globalCache, 'get')
                chai.spy.restore(kafkaConnector.telemetryService, "dispatch")
                done()
            })
    });
    it("it should not ingest data when invalid extraction config present for batch", (done) => {
        chai.spy.on(dbConnector, "listRecords", () => {
            return Promise.resolve([ {} ])
        })
        chai.spy.on(globalCache, 'get', () => {
            return [ { "id": ":datasetId", "status": DatasetStatus.Live, "dataset_config": { "entry_topic": "topic" }, "extraction_config": { "is_batch_event": true, "extraction_key": "eventas", "batch_id": "ids" } } ]
        })
        chai
            .request(app)
            .post(config.apiDatasetIngestEndPoint)
            .send(TestDataIngestion.SAMPLE_INPUT)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus[ "400_NAME" ]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routesConfig.data_ingest.api_id);
                res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                chai.spy.restore(dbConnector, "listRecords")
                chai.spy.restore(globalCache, 'get')
                chai.spy.restore(kafkaConnector.telemetryService, "dispatch")
                done()
            })
    });
    it("it should not ingest data successfully", (done) => {
        chai.spy.on(dbConnector, "listRecords", () => {
            return Promise.reject(new Error("error occurred while connecting to postgres"))
        })
        chai.spy.on(globalCache, 'get', () => {
            return [ { "id": "datasetId", "dataset_config": { "entry_topic": "topic" } } ]
        })

        chai
            .request(app)
            .post(config.apiDatasetIngestEndPoint)
            .send(TestDataIngestion.SAMPLE_INPUT)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus[ "500_NAME" ]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routesConfig.data_ingest.api_id);
                res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                chai.spy.restore(dbConnector, "listRecords")
                chai.spy.restore(globalCache, 'get')
                done()
            })
    });
    it("it should not ingest data successfully", (done) => {
        chai.spy.on(globalCache, 'get', () => {
            return [ {} ]
        })
        chai.spy.on(dbConnector, "listRecords", () => {
            return Promise.resolve([ {} ])
        })

        chai
            .request(app)
            .post(config.apiDatasetIngestEndPoint)
            .send(TestDataIngestion.SAMPLE_INPUT)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus[ "404_NAME" ]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routesConfig.data_ingest.api_id);
                res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                chai.spy.restore(globalCache, "get")
                chai.spy.restore(dbConnector, "listRecords")
                done();
            });
    });
    it("it should not ingest data when datasetid param is empty", (done) => {
        chai
            .request(app)
            .post(config.apiDatasetIngestEndPoint.replace(':datasetId', " /"))
            .send(TestDataIngestion.SAMPLE_INPUT)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus[ "400_NAME" ]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routesConfig.data_ingest.api_id);
                res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                done();
            });
    });
    it("it should not establish connection with kafka", (done) => {
        chai.spy.on(kafkaConnector.telemetryService, "health", () => {
            return Promise.reject("error connecting to kafka")
        })
        ingestorService.init()
        expect(kafkaConnector.telemetryService.health).to.be.called
        chai.spy.restore(kafkaConnector.telemetryService, "health")
        done();
    });
    it("it should establish connection with kafka", (done) => {
        chai.spy.on(kafkaConnector.telemetryService, "health", () => {
            return Promise.resolve("connected to kafka")
        })
        ingestorService.init()
        expect(kafkaConnector.telemetryService.health).to.be.called
        chai.spy.restore(kafkaConnector.telemetryService, "health")
        done();
    });
})

describe("SUBMIT INGESTION API", () => {
    beforeEach(() => {
        nock(config.druidHost + ":" + config.druidPort)
            .post(config.druidSubmitIngestionEndPoint)
            .reply(200)
    })
    afterEach(() => {
        nock.cleanAll()
    })
    it("should submit ingestion successfully", (done)=>{
        chai
        .request(app)
        .post(config.apiSubmitIngestionEndPoint)
        .send(TestSubmitIngestion.VALID_INGESTION_SPEC)
        .end((err, res) => {
            res.should.have.status(httpStatus.OK);
            res.body.should.be.a("object");
            res.body.responseCode.should.be.eq(httpStatus[ "200_NAME" ]);
            res.body.should.have.property("result");
            res.body.id.should.be.eq(routesConfig.submit_ingestion.api_id);
            res.body.params.status.should.be.eq(constants.STATUS.SUCCESS)
            done()
        })
    })
    it("should throw error for invalid request object", (done)=>{
        chai
        .request(app)
        .post(config.apiSubmitIngestionEndPoint)
        .send(TestSubmitIngestion.INVALID_INGESTION_SPEC)
        .end((err, res) => {
            res.should.have.status(httpStatus.BAD_REQUEST);
            res.body.should.be.a("object");
            res.body.responseCode.should.be.eq(httpStatus[ "400_NAME" ]);
            res.body.should.have.property("result");
            res.body.id.should.be.eq(routesConfig.submit_ingestion.api_id);
            res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
            done()
        })
    })
})

describe("SUBMIT INGESTION ERROR SCENARIOS", ()=>{
        beforeEach(() => {
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidSubmitIngestionEndPoint)
                .reply(500)
        })
        afterEach(() => {
            nock.cleanAll()
        })
        it("should handle errors", (done)=>{
            chai
            .request(app)
            .post(config.apiSubmitIngestionEndPoint)
            .send(TestSubmitIngestion.VALID_INGESTION_SPEC)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routesConfig.submit_ingestion.api_id);
                res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                done()
    })
})
})
