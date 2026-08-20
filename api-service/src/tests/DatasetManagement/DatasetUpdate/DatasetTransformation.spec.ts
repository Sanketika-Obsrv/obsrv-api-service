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
import { sequelize } from "../../../connections/databaseConnection";
import { userService } from "../../../services/UserService";
import { config } from "../../../configs/Config";
import { buildRbacToken, NO_ACCESS_ROLE } from "../../helpers/rbacTestHelper";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("DATASET TRANSFORMATIONS UPDATE", () => {

    afterEach(() => {
        chai.spy.restore();
        config.is_RBAC_enabled = "false";
    });

    it("Success: Dataset transformations successfully added", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", version_key: validVersionKey, type:"event", api_version: "v2", "transformations_config":[]
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_TRANSFORMATIONS_ADD)
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

    it("Success: Dataset transformations successfully removed", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", version_key: validVersionKey, type:"event", api_version: "v2", "transformations_config":[{ "field_key": "key1", "transformation_function": { "type": "mask", "expr": "eid", "datatype": "string", "category": "pii" }, "mode": "Strict" }]
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_TRANSFORMATIONS_REMOVE)
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

    it("Success: When payload contains same transformation field_key to be added, updated or removed", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ id: "telemetry", status: "Draft", version_key: validVersionKey, type:"event", api_version: "v2" })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_WITH_SAME_TRANSFORMATION_ADD_REMOVE)
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

    it("Dataset transformations update failure: RBAC enabled and user lacks a valid role", (done) => {
        config.is_RBAC_enabled = "true";
        chai.spy.on(userService, "getUser", () => {
            return Promise.resolve({ roles: [NO_ACCESS_ROLE] })
        })
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .set("Authorization", `Bearer ${buildRbacToken()}`)
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_TRANSFORMATIONS_ADD)
            .end((err, res) => {
                res.should.have.status(httpStatus.FORBIDDEN);
                done();
            });
    });

})