import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import { DatasetDraft } from "../../../models/DatasetDraft";
import _ from "lodash";
import { TestInputsForDatasetUpdate } from "./Fixtures";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("DATASET TAGS UPDATE", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Success: Dataset tags successfully added", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", denorm_config: { denorm_fields: [] }
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_TAG_ADD)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.dataset.update");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                done();
            });
    });

    it("Success: Dataset tags successfully removed", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", tags: ["tag1", "tag2"]
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_TAG_REMOVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.dataset.update");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                done();
            });
    });

    it("Success: When payload contains same tags to be added or removed", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", tags: ["tag1", "tag2"]
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_WITH_SAME_TAGS_ADD)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.dataset.update");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                done();
            });
    });

    it("Failure: When tags provided to add already exists", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", tags: ["tag3", "tag1"]
            })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.dataset.update");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Dataset tags already exist")
                done();
            });
    });

    it("Failure: When tags provided to delete does not exists", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", tags: ["tag5"]
            })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.dataset.update");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Dataset tags do not exist to remove")
                done();
            });
    });

})