import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from "mocha";
import _ from "lodash";
import { TestInputsForDatasetStatusTransition } from "./Fixtures";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { DatasetTransformationsDraft } from "../../../models/TransformationDraft";
import { DatasetSourceConfigDraft } from "../../../models/DatasetSourceConfigDraft";
import { DatasourceDraft } from "../../../models/DatasourceDraft";
import { sequelize } from "../../../connections/databaseConnection";
import { userService } from "../../../services/UserService";
import { config } from "../../../configs/Config";
import { buildRbacToken, NO_ACCESS_ROLE } from "../../helpers/rbacTestHelper";


chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6"

describe("DATASET STATUS TRANSITION DELETE", () => {

    afterEach(() => {
        chai.spy.restore();
        config.is_RBAC_enabled = "false";
    });

    it("Dataset status transition success: When the action is to Delete draft datasets", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "Draft", id: "telemetry.1" })
        })
        chai.spy.on(DatasetTransformationsDraft, "destroy", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetSourceConfigDraft, "destroy", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasourceDraft, "destroy", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetDraft, "destroy", () => {
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
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_DELETE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to Delete successful")
                res.body.result.dataset_id.should.be.eq("telemetry.1")
                done();
            });
    });

    it("Dataset status transition failure: When dataset is not found to delete", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve()
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_DELETE)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Dataset not found for dataset: telemetry.1")
                res.body.error.code.should.be.eq("DATASET_NOT_FOUND")
                done();
            });
    });

    it("Dataset status transition delete failure: RBAC enabled and user lacks a valid role", (done) => {
        config.is_RBAC_enabled = "true";
        chai.spy.on(userService, "getUser", () => {
            return Promise.resolve({ roles: [NO_ACCESS_ROLE] })
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .set("Authorization", `Bearer ${buildRbacToken()}`)
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_DELETE)
            .end((err, res) => {
                res.should.have.status(httpStatus.FORBIDDEN);
                done();
            });
    });
})