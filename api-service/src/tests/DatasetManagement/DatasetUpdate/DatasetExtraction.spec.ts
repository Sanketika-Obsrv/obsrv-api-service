import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from "mocha";
import { DatasetDraft } from "../../../models/DatasetDraft";
import _ from "lodash";
import { TestInputsForDatasetUpdate, msgid, requestStructure, validVersionKey } from "./Fixtures";
import { apiId, invalidInputErrCode } from "../../../controllers/DatasetUpdate/DatasetUpdate"
import { sequelize } from "../../../connections/databaseConnection";
import { userService } from "../../../services/UserService";
import { config } from "../../../configs/Config";
import { buildRbacToken, NO_ACCESS_ROLE } from "../../helpers/rbacTestHelper";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("DATASET EXTRACTION CONFIG UPDATE", () => {

    afterEach(() => {
        chai.spy.restore();
        config.is_RBAC_enabled = "false";
    });

    it("Success: Dataset extraction configs updated if it is a batch event", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", version_key: validVersionKey, api_version: "v2", type: "event"
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_EXTRACTION_DROP_DUPLICATES)
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

    it("Success: Dataset extraction configs updated with default values if it is not batch event", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", version_key: validVersionKey, api_version: "v2", type: "event"
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .send({
                ...requestStructure, request: {
                    dataset_id: "telemetry", version_key: validVersionKey,
                    "extraction_config": {
                        "is_batch_event": false,
                        "extraction_key": "events",
                        "dedup_config": {
                            "drop_duplicates": true,
                            "dedup_key": "id"
                        }
                    }
                }
            })
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


    it("Failure: Extraction configs not provided as batch event is true", (done) => {
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .send({ ...requestStructure, request: { dataset_id: "telemetry", version_key: validVersionKey, extraction_config: { "is_batch_event": true } } })
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                expect(res.body.error.message).to.match(/^#properties\/request(.+)$/)
                res.body.error.code.should.be.eq(invalidInputErrCode)
                done();
            });
    });

    it("Dataset extraction config update failure: RBAC enabled and user lacks a valid role", (done) => {
        config.is_RBAC_enabled = "true";
        chai.spy.on(userService, "getUser", () => {
            return Promise.resolve({ roles: [NO_ACCESS_ROLE] })
        })
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .set("Authorization", `Bearer ${buildRbacToken()}`)
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_EXTRACTION_DROP_DUPLICATES)
            .end((err, res) => {
                res.should.have.status(httpStatus.FORBIDDEN);
                done();
            });
    });
})