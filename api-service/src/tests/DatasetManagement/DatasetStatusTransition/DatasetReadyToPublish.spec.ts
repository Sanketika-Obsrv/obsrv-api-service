import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from "mocha";
import _ from "lodash";
import { TestInputsForDatasetStatusTransition } from "./Fixtures";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { userService } from "../../../services/UserService";
import { config } from "../../../configs/Config";
import { buildRbacToken, NO_ACCESS_ROLE } from "../../helpers/rbacTestHelper";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6"

describe("DATASET STATUS TRANSITION READY TO PUBLISH", () => {

    afterEach(() => {
        chai.spy.restore();
        config.is_RBAC_enabled = "false";
    });

    it("Dataset status transition success: When the action is make dataset ready to publish", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_READY_TO_PUBLISH)
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({})
        })

        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_REQUEST_FOR_READY_FOR_PUBLISH)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to ReadyToPublish successful")
                res.body.result.dataset_id.should.be.eq("telemetry")
                done();
            });
    });

    it("Dataset status transition success: When the action is make master dataset ready to publish", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetStatusTransition.VALID_MASTER_SCHEMA_FOR_READY_TO_PUBLISH)
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({})
        })

        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_REQUEST_FOR_READY_FOR_PUBLISH)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to ReadyToPublish successful")
                res.body.result.dataset_id.should.be.eq("telemetry")
                done();
            });
    });

    it("Dataset status transition failure: When dataset is not found to ready to publish", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve()
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_REQUEST_FOR_READY_FOR_PUBLISH)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Dataset not found for dataset: telemetry")
                res.body.error.code.should.be.eq("DATASET_NOT_FOUND")
                done();
            });
    });

    it("Dataset status transition failure: When dataset is already ready to publish", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ ...TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_READY_TO_PUBLISH, "status": "ReadyToPublish" })
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_REQUEST_FOR_READY_FOR_PUBLISH)
            .end((err, res) => {
                res.should.have.status(httpStatus.CONFLICT);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Transition failed for dataset: dataset-all-fields7 status:ReadyToPublish with status transition to ReadyToPublish")
                res.body.error.code.should.be.eq("DATASET_READYTOPUBLISH_FAILURE")
                done();
            });
    });


    it("Dataset status transition failure: Configs invalid to set status to ready to publish", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetStatusTransition.INVALID_SCHEMA_FOR_READY_TO_PUBLISH)
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_REQUEST_FOR_READY_FOR_PUBLISH)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                expect(res.body.error.message).to.match(/^#required must have(.+)/)
                res.body.error.code.should.be.eq("DATASET_CONFIGS_INVALID")
                done();
            });
    });

    it("Dataset status transition ready to publish failure: RBAC enabled and user lacks a valid role", (done) => {
        config.is_RBAC_enabled = "true";
        chai.spy.on(userService, "getUser", () => {
            return Promise.resolve({ roles: [NO_ACCESS_ROLE] })
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .set("Authorization", `Bearer ${buildRbacToken()}`)
            .send(TestInputsForDatasetStatusTransition.VALID_REQUEST_FOR_READY_FOR_PUBLISH)
            .end((err, res) => {
                res.should.have.status(httpStatus.FORBIDDEN);
                done();
            });
    });
})