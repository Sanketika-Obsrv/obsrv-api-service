import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import { TestInputsForDataIngestion } from "./Fixtures";
import { describe, it } from "mocha";
import { Dataset } from "../../../models/Dataset";
import { Datasource } from "../../../models/Datasource";
import sinon from "sinon";
import { Kafka } from "kafkajs";
import { connectionConfig } from "../../../configs/ConnectionsConfig";
import { userService } from "../../../services/UserService";
import { config } from "../../../configs/Config";
import { buildRbacToken, NO_ACCESS_ROLE } from "../../helpers/rbacTestHelper";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const kafka = new Kafka(connectionConfig.kafka.config);

const apiEndpoint = "/v2/data/in/:datasetId"
const resultResponse = [
    {
        topicName: "local.test.topic",
        partition: 0,
        errorCode: 0,
        baseOffset: "257",
        logAppendTime: "-1",
        logStartOffset: "0"
    }
]
const kafkaModule = require("../../../connections/kafkaConnection");

describe("DATA INGEST API", () => {
    afterEach(() => {
        chai.spy.restore();
        sinon.restore();
        config.is_RBAC_enabled = "false";
    });

    it("it should ingest data for individual event", (done) => {
        chai.spy.on(Datasource, "findOne", () => {
            return Promise.resolve(null)
        })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({
                dataset_config: {
                    entry_topic: "local.test.topic",
                },
                extraction_config: {
                    is_batch_event: false,
                    extraction_key: "events",
                    batch_id: "id"
                }
            })
        })
        const connectionStub = sinon.stub(kafkaModule, "connect").returns(true);
        const sendStub = sinon.stub(kafkaModule, "send").returns(resultResponse);

        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.INDIVIDUAL_EVENT)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api.data.in");
                res.body.result.message.should.be.eq("Data ingested successfully")
                connectionStub.restore()
                sendStub.restore()
                done()
            })
    });

    it("it should ingest data successfully", (done) => {
        chai.spy.on(Datasource, "findOne", () => {
            return Promise.resolve(null)
        })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({
                dataset_config: {
                    entry_topic: "local.test.topic",
                }
            })
        })
        const connectionStub = sinon.stub(kafkaModule, "connect").returns(true);
        const sendStub = sinon.stub(kafkaModule, "send").returns(resultResponse);
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
                done()
            })
    });

    it("it should ingest data successfully v2", (done) => {
        chai.spy.on(Datasource, "findOne", () => {
            return Promise.resolve(null)
        })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({
                api_version: "v2",
                entry_topic: "local.test.topic",
            })
        })
        const connectionStub = sinon.stub(kafkaModule, "connect").returns(true);
        const sendStub = sinon.stub(kafkaModule, "send").returns(resultResponse);
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
                done()
            })
    });

    it("Failed to connect kafka.", (done) => {
        chai.spy.on(Datasource, "findOne", () => {
            return Promise.resolve(null)
        })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({
                dataset_config: {
                    entry_topic: "local.test.topic",
                }
            })
        })
        // testSetup.ts stubs kafkaModule.send globally (suite-wide, to stop tests from making
        // real broker connection attempts in the background) so this test needs its own stub on
        // send specifically to actually simulate a kafka failure, not just connect.
        const connectionStub = sinon.stub(kafkaModule, "connect").resolves(false);
        const sendStub = sinon.stub(kafkaModule, "send").rejects(new Error("Unable to connect to kafka"));
        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.SAMPLE_INPUT_1)
            .end((err, res) => {
                res.should.have.status(500);
                res.body.should.be.a("object");
                res.body.id.should.be.eq("api.data.in");
                res.body.params.status.should.be.eq("FAILED");
                connectionStub.restore()
                sendStub.restore()
                done()
            })
    }).timeout(5000);

    it("Entry topic not found", (done) => {
        chai.spy.on(Datasource, "findOne", () => {
            return Promise.resolve(null)
        })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({
                dataset_config: {}
            })
        })

        chai
            .request(app)
            .post(apiEndpoint)
            .send(TestInputsForDataIngestion.SAMPLE_INPUT)
            .end((err, res) => {
                res.should.have.status(404);
                res.body.should.be.a("object");
                res.body.id.should.be.eq("api.data.in");
                res.body.params.status.should.be.eq("FAILED");
                res.body.error.message.should.be.eq("Entry topic not found")
                res.body.error.code.should.be.eq("TOPIC_NOT_FOUND");
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
                res.body.id.should.be.eq("api.data.in");
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("#required must have required property 'id'")
                res.body.error.code.should.be.eq("DATA_INGESTION_INVALID_INPUT");
                done()
            })
    });

    it("Dataset not found", (done) => {
        chai.spy.on(Datasource, "findOne", () => {
            return Promise.resolve(null)
        })
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
                res.body.id.should.be.eq("api.data.in");
                res.body.params.status.should.be.eq("FAILED");
                res.body.error.message.should.be.eq("Dataset with id/alias name ':datasetId' not found")
                res.body.error.code.should.be.eq("DATASET_NOT_FOUND");
                done()
            })
    });

    it("Database connection failure", (done) => {
        chai.spy.on(Datasource, "findOne", () => {
            return Promise.resolve(null)
        })
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
                res.body.params.status.should.be.eq("FAILED");
                res.body.error.code.should.be.eq("INTERNAL_SERVER_ERROR");
                done();
            });
    });

    it("Data ingestion failure: RBAC enabled and user lacks a valid role", (done) => {
        config.is_RBAC_enabled = "true";
        chai.spy.on(userService, "getUser", () => {
            return Promise.resolve({ roles: [NO_ACCESS_ROLE] })
        })
        chai
            .request(app)
            .post(apiEndpoint)
            .set("Authorization", `Bearer ${buildRbacToken()}`)
            .send(TestInputsForDataIngestion.SAMPLE_INPUT_1)
            .end((err, res) => {
                res.should.have.status(403);
                done()
            })
    });
})

