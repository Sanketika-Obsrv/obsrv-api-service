import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from "mocha";
import { DatasetDraft } from "../../../models/DatasetDraft";
import _ from "lodash";
import { TestInputsForDatasetUpdate, msgid, validVersionKey } from "./Fixtures";
import { apiId } from "../../../controllers/DatasetUpdate/DatasetUpdate"
import { userService } from "../../../services/UserService";
import { config } from "../../../configs/Config";
import { buildRbacToken, NO_ACCESS_ROLE } from "../../helpers/rbacTestHelper";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("DATASET DENORM UPDATE", () => {

    afterEach(() => {
        chai.spy.restore();
        config.is_RBAC_enabled = "false";
    });

    it("Success: Dataset denorms successfully added", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", type:"event", version_key: validVersionKey, api_version:"v2", denorm_config: { denorm_field: [] }
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_DENORM_ADD)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                res.body.result.version_key.should.be.a("string")
                done();
            });
    });

    it("Success: Dataset denorms successfully removed", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", type:"event", version_key: validVersionKey,  api_version:"v2", denorm_config: { denorm_fields: [{ denorm_out_field: "userdata" }] }
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_DENORM_REMOVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                res.body.result.version_key.should.be.a("string")
                done();
            });
    });

    it("Success: When payload contains same denorms to be removed", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", version_key: validVersionKey, type:"dataset", api_version:"v2", status: "Draft", denorm_config: {
                    denorm_fields: [{
                        "denorm_key": "actor.id",
                        "denorm_out_field": "mid",
                        "dataset_id": "master"
                    }]
                }
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_WITH_SAME_DENORM_REMOVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                res.body.result.version_key.should.be.a("string")
                done();
            });
    });

    it("Success: Ignore the denorm when payload contains denorm that already exists", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", version_key: validVersionKey, type:"dataset", api_version:"v2", status: "Draft", denorm_config: {
                    denorm_fields: [ {
                        "denorm_key": "actor.id",
                        "denorm_out_field": "mid",
                        "dataset_id": "master"
                    }]
                }
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_WITH_EXISTING_DENORM)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                res.body.result.version_key.should.be.a("string")
                done();
            });
    });

    it("Dataset denorm update failure: RBAC enabled and user lacks a valid role", (done) => {
        config.is_RBAC_enabled = "true";
        chai.spy.on(userService, "getUser", () => {
            return Promise.resolve({ roles: [NO_ACCESS_ROLE] })
        })
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .set("Authorization", `Bearer ${buildRbacToken()}`)
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_DENORM_ADD)
            .end((err, res) => {
                res.should.have.status(httpStatus.FORBIDDEN);
                done();
            });
    });

})