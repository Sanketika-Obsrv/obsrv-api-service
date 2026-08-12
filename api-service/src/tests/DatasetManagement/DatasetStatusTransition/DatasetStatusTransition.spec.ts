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

describe("DATASET STATUS TRANSITION API", () => {

    afterEach(() => {
        chai.spy.restore();
        config.is_RBAC_enabled = "false";
    });

    it("Dataset status transition failure: Invalid request payload provided", (done) => {

        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.INVALID_SCHEMA)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                expect(res.body.error.message).to.match(/^#properties\/request(.+)$/)
                res.body.error.code.should.be.eq("DATASET_STATUS_TRANSITION_INVALID_INPUT")
                done();
            });
    });

    it("Dataset status transition failure: When the action is performed on v1 apis", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ api_version: "v1" })
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq("DATASET_API_VERSION_MISMATCH")
                res.body.error.message.should.be.eq("Draft dataset api version is not v2. Perform a read api call with mode=edit to migrate the dataset")
                done();
            });
    });

    it("Dataset status transition failure: RBAC enabled and user lacks a valid role", (done) => {
        config.is_RBAC_enabled = "true";
        chai.spy.on(userService, "getUser", () => {
            return Promise.resolve({ roles: [NO_ACCESS_ROLE] })
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .set("Authorization", `Bearer ${buildRbacToken()}`)
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.FORBIDDEN);
                done();
            });
    });
})