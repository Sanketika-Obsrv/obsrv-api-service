import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import _ from "lodash";
import { apiId } from "../../../controllers/DatasetStatusTransition/DatasetStatusTransition";
import { TestInputsForDatasetStatusTransition } from "./Fixtures";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { DatasetTransformationsDraft } from "../../../models/TransformationDraft";
import { DatasetSourceConfigDraft } from "../../../models/DatasetSourceConfigDraft";
import { DatasourceDraft } from "../../../models/DatasourceDraft";
import { sequelize } from "../../../connections/databaseConnection";


chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6"

describe("DATASET STATUS TRANSITION DELETE", () => {

    afterEach(() => {
        chai.spy.restore();
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
                res.body.id.should.be.eq(apiId);
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
        const t = chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve(sequelize.transaction)
        })
        chai.spy.on(t, "rollback", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_DELETE)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Dataset not found to delete")
                res.body.error.code.should.be.eq("DATASET_NOT_FOUND")
                done();
            });
    });
})