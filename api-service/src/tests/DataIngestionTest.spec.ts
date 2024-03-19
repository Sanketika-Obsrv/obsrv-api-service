import app from "../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import { TestDataIngestion, TestInputsForDataIngestion } from "./Fixtures";
import { describe, it } from 'mocha';
import { Dataset } from "../models/Dataset";
import logger from "../logger";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const apiEndpoint = "/v1/data/in/added-tags"

const { Kafka } = require('kafkajs');
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
});

const producer = kafka.producer();
let isConnected = false;

const connect = async () => {
    await producer.connect()
        .then(() => {
            isConnected = true;
            logger.info("kafka dispatcher is ready");
        })
        .catch((err: any) => {
            logger.error("Unable to connect to kafka", err?.message);
        });
}

const send = async (payload: any, topic: string) => {
    if (!isConnected) {
        await connect()
    }
    return producer.send({
        topic,
        messages: [{ value: JSON.stringify(payload) }]
    });
}

describe("DATA INGEST API", () => {
    afterEach(() => {
        chai.spy.restore()
    })

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
        const spyOnKafkaProducer = chai.spy(send);
        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.SAMPLE_INPUT)
            .end(async (err, res) => {
                try {
                    res.should.have.status(200);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq("OK");
                    res.body.should.have.property("result");
                    expect(spyOnKafkaProducer).to.not.have.been.called();
                    const result = await spyOnKafkaProducer(TestDataIngestion.SAMPLE_INPUT, "local.ingest");
                    expect(spyOnKafkaProducer).to.have.been.called.with(TestDataIngestion.SAMPLE_INPUT, "local.ingest");
                    expect(result).to.be.an("array");
                    done()
                }
                catch (err) {
                    done(err)
                }
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
                        extraction_key: "1",
                        batch_id: "1"
                    },
                }
            })
        })

        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.SAMPLE_INPUT_1)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
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
                done()
            })
    });

    it("it should ingest data for individual event", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({
                dataValues: {
                    dataset_config: {
                        entry_topic: 'local.test.topic',
                    }
                }
            })
        })

        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.INDIVIDUAL_EVENT)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                done()
            })
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
                done()
            })
    });
})

