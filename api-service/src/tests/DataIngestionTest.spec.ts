import app from "../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import { TestInputsForDataIngestion } from "./Fixtures";
import { describe, it } from 'mocha';
import { Dataset } from "../models/Dataset";
import sinon from "sinon";
import { producer } from "../connections/kafkaConnection";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

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
        sinon.stub(kafkaModule, "connect").returns(true);
        sinon.stub(kafkaModule, "send").returns(resultResponse);

        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.SAMPLE_INPUT_1)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api");
                chai.spy.restore(Dataset, "findOne")
                kafkaModule.connect.restore()
                kafkaModule.send.restore()
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
        sinon.stub(producer, "connect").rejects(false);
        sinon.stub(producer, "send").rejects(true)
        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.INVALID_EXTRACTION_CONFIG)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("FAILED")
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

        sinon.stub(kafkaModule, "connect").returns(false)

        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.SAMPLE_INPUT_1)
            .end((err, res) => {
                res.should.have.status(500);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                kafkaModule.connect.restore();
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("FAILED")
                done()
            })
    });

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
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("FAILED")
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
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("FAILED")
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
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("FAILED")
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
                console.log({res})
                res.should.have.status(500);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("FAILED")
                done();
            });
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
        sinon.stub(kafkaModule, "connect").returns(true);
        sinon.stub(kafkaModule, "send").returns(resultResponse);
        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.INDIVIDUAL_EVENT)
            .end(async (err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api");
                kafkaModule.connect.restore()
                kafkaModule.send.restore()
                chai.spy.restore(Dataset, "findOne");
            })
        done()
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
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("FAILED")
                done()
            })
    });
})

