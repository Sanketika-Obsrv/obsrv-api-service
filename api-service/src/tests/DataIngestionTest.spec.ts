import app from "../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import { TestInputsForDataIngestion } from "./Fixtures";
import { describe, it } from 'mocha';
import { Dataset } from "../models/Dataset";
import sinon from "sinon";
import { Kafka } from "kafkajs";
import { connectionConfig } from "../configs/ConnectionsConfig";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const kafka = new Kafka(connectionConfig.kafka.config);
const producer = kafka.producer();

const apiEndpoint = "/v1/data/in/:datasetId"
const resultResponse = [
    {
        topicName: 'local.test.topic',
        partition: 0,
        errorCode: 0,
        baseOffset: '257',
        logAppendTime: '-1',
        logStartOffset: '0'
    }
]
const kafkaModule = require("../connections/kafkaConnection");

describe("DATA INGEST API", () => {
    afterEach(() => {
        chai.spy.restore(Dataset, "findOne");
    });

    it("it should ingest data for individual event", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({
                dataValues: {
                    dataset_config: {
                        entry_topic: 'local.test.topic',
                    },
                    extraction_config: {
                        is_batch_event: false,
                        extraction_key: "events",
                        batch_id: "id"
                    }
                }
            })
        })
        let connectionStub = sinon.stub(kafkaModule, "connect").returns(true);
        let sendStub = sinon.stub(kafkaModule, "send").returns(resultResponse);

        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.INDIVIDUAL_EVENT)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api.data.in");
                chai.spy.restore(Dataset, "findOne");
                res.body.result.message.should.be.eq("Data ingested successfully")
                connectionStub.restore()
                sendStub.restore()
                done()
            })
    });

    it("it should ingest data successfully", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({
                dataValues: {
                    dataset_config: {
                        entry_topic: 'local.test.topic',
                    }
                }
            })
        })
        let connectionStub = sinon.stub(kafkaModule, "connect").returns(true);
        let sendStub = sinon.stub(kafkaModule, "send").returns(resultResponse);
        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.SAMPLE_INPUT_1)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api.data.in");
                res.body.result.message.should.be.eq("Data ingested successfully")
                connectionStub.restore()
                sendStub.restore()
                chai.spy.restore(Dataset, "findOne")
                done()
            })
    });

    it("it should not ingest data when invalid extraction config present for batch", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({
                dataValues: {
                    dataset_config: {
                        entry_topic: 'local.test.topic',
                    },
                    extraction_config: {
                        is_batch_event: true,
                        extraction_key: "events",
                        batch_id: "id"
                    }
                }
            })
        })
        let connectionStub = sinon.stub(kafkaModule, "connect").rejects(false);
        let sinonStub = sinon.stub(kafkaModule, "send").rejects(true)
        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.INVALID_EXTRACTION_CONFIG)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api.data.in");
                res.body.params.status.should.be.eq("FAILED");
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                connectionStub.restore()
                sinonStub.restore()
                done()
            })
    });

    it("it should ingest data when valid extraction config present for batch", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({
                dataValues: {
                    dataset_config: {
                        entry_topic: 'local.test.topic',
                    },
                    extraction_config: {
                        is_batch_event: true,
                        extraction_key: "events",
                        batch_id: "id"
                    }
                }
            })
        })
        let connectionStub = sinon.stub(kafkaModule, "connect").resolves(true);
        let sinonStub = sinon.stub(kafkaModule, "send").resolves(resultResponse)
        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.VALID_CONFIG)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api.data.in");
                res.body.params.status.should.be.eq("SUCCESS");
                res.body.result.message.should.be.eq("Data ingested successfully");
                connectionStub.restore()
                sinonStub.restore()
                done()
            })
    });

    it("Failed to connect kafka.", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({
                dataValues: {
                    dataset_config: {
                        entry_topic: 'local.test.topic',
                    }
                }
            })
        })
        let connectionStub = sinon.stub(kafkaModule, "connect").resolves(false);
        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.SAMPLE_INPUT_1)
            .end((err, res) => {
                res.should.have.status(500);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api.data.in");
                res.body.params.status.should.be.eq("FAILED");
                connectionStub.restore()
                done()
            })
    }).timeout(5000);

    it("Entry topic not found", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({
                dataValues: {
                    dataset_config: {}
                }
            })
        })

        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.SAMPLE_INPUT)
            .end((err, res) => {
                res.should.have.status(404);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api.data.in");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Entry topic is not defined")
                done()
            })
    });

    it("Invalid request body", (done) => {
        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.INVALID_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api.data.in");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("#required should have required property 'data'")
                done()
            })
    });

    it("Dataset not found", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve(null)
        })

        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.SAMPLE_INPUT)
            .end((err, res) => {
                res.should.have.status(404);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api.data.in");
                res.body.params.status.should.be.eq("FAILED");
                res.body.params.errmsg.should.be.eq("Dataset with id not found")
                done()
            })
    });

    it("Database connection failure", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.reject({})
        })
        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.SAMPLE_INPUT)
            .end((err, res) => {
                res.should.have.status(500);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.data.in");
                res.body.params.status.should.be.eq("FAILED")
                done();
            });
    });

    it("Unknown errors", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.reject({})
        })

        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.SAMPLE_INPUT)
            .end((err, res) => {
                res.should.have.status(500);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api.data.in");
                res.body.params.status.should.be.eq("FAILED")
                done()
            })
    });
})

