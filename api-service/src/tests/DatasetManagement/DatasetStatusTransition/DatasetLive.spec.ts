import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import _ from "lodash";
import { apiId, errorCode } from "../../../controllers/DatasetStatusTransition/DatasetStatusTransition";
import { TestInputsForDatasetStatusTransition } from "./Fixtures";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { sequelize } from "../../../connections/databaseConnection";
import { commandHttpService } from "../../../connections/commandServiceConnection";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6"

describe("DATASET STATUS TRANSITION LIVE", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset status transition success: When the action is to set dataset live", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "ReadyToPublish" })
        })
        chai.spy.on(commandHttpService, "post", () => {
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
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to Live successful")
                res.body.result.dataset_id.should.be.eq("telemetry.1")
                done();
            });
    });

    it("Dataset status transition failure: When dataset is not found to publish", (done) => {
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
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Dataset not found to perform status transition to live")
                res.body.error.code.should.be.eq("DATASET_NOT_FOUND")
                done();
            })
    })

    it("Dataset status transition failure: When the command api call to publish dataset fails", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "ReadyToPublish" })
        })
        chai.spy.on(commandHttpService, "post", () => {
            return Promise.reject()
        })
        const t = chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve(sequelize.transaction)
        })
        chai.spy.on(t, "rollback", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq(errorCode)
                res.body.error.message.should.be.eq("Failed to perform status transition on datasets")
                done();
            });
    });

    it("Dataset status transition failure: When the dataset to publish is in draft state", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "Draft" })
        })
        const t = chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve(sequelize.transaction)
        })
        chai.spy.on(t, "rollback", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq("DATASET_LIVE_FAILURE")
                res.body.error.message.should.be.eq("Failed to mark dataset Live as it is not in ready to publish state")
                done();
            });
    });

})