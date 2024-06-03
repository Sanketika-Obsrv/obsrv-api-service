import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import _ from "lodash";
import { apiId } from "../../../controllers/DatasetStatus/DatasetStatus";
import { TestInputsForDatasetStatus } from "./Fixtures";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { sequelize } from "../../../connections/databaseConnection";


chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6"

describe("DATASET STATUS READY TO PUBLISH", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset status success: When the action is make dataset ready to publish", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetStatus.VALID_SCHEMA_FOR_READY_TO_PUBLISH)
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({})
        })
        const t = chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve(sequelize.transaction)
        })
        chai.spy.on(t, "commit", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v2/datasets/status")
            .send(TestInputsForDatasetStatus.VALID_REQUEST_FOR_READY_FOR_PUBLISH)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to ReadyToPublish successful")
                res.body.result.dataset_id.should.be.eq("telemetry.1")
                done();
            });
    });

    it("Dataset status failure: When dataset is not found to ready to publish", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve()
        })
        const t = chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve(sequelize.transaction)
        })
        chai.spy.on(t, "rollback", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v2/datasets/status")
            .send(TestInputsForDatasetStatus.VALID_REQUEST_FOR_READY_FOR_PUBLISH)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Dataset not found to perform status transition to ReadyToPublish")
                res.body.error.code.should.be.eq("DATASET_NOT_FOUND")
                done();
            });
    });

    it("Dataset status failure: When dataset is already ready to publish", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({dataset_id:"telemetry", status:"ReadyToPublish"})
        })
        const t = chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve(sequelize.transaction)
        })
        chai.spy.on(t, "rollback", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v2/datasets/status")
            .send(TestInputsForDatasetStatus.VALID_REQUEST_FOR_READY_FOR_PUBLISH)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Failed to ReadyToPublish dataset as it is in readytopublish state")
                res.body.error.code.should.be.eq("DATASET_READYTOPUBLISH_FAILURE")
                done();
            });
    });


    it("Dataset status failure: Configs invalid to set status to ready to publish", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetStatus.INVALID_SCHEMA_FOR_READY_TO_PUBLISH)
        })
        const t = chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve(sequelize.transaction)
        })
        chai.spy.on(t, "rollback", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v2/datasets/status")
            .send(TestInputsForDatasetStatus.VALID_REQUEST_FOR_READY_FOR_PUBLISH)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                expect(res.body.error.message).to.match(/^#properties(.+)should be equal to one of the allowed values$/)
                res.body.error.code.should.be.eq("DATASET_CONFIGS_INVALID")
                done();
            });
    });
})