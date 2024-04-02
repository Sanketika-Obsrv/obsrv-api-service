import app from "../../../app";
import chai, { expect } from "chai";
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

describe("DATASET DENORM UPDATE", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Success: Dataset denorms successfully added", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", denorm_config: { denorm_field: [] }
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_DENORM_ADD)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.update");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                done();
            });
    });

    it("Success: Dataset denorms successfully removed", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", denorm_config: { denorm_fields: [{ denorm_out_field: "userdata" }] }
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_DENORM_REMOVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.update");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                done();
            });
    });

    it("Success: When payload contains same denorms to be removed", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", denorm_config: {
                    denorm_fields: [{
                        "denorm_key": "actor.id",
                        "denorm_out_field": "mid"
                    }]
                }
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_WITH_SAME_DENORM_REMOVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.update");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                done();
            });
    });


    it("Failure: Dataset contains duplicate denorm field", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ status: "Draft" })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_DUPLICATE_DENORM_KEY)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.update");
                res.body.params.status.should.be.eq("FAILED")
                expect(res.body.params.errmsg).to.match(/^Dataset contains duplicate denorm out keys(.+)$/)
                done();
            });
    });

    it("Failure: When denorm fields provided to add already exists", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", tags: ["tag1", "tag2"], denorm_config: {
                    denorm_fields: [{
                        "denorm_key": "actor.id",
                        "denorm_out_field": "userdata"
                    }]
                }
            })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.update");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Denorm fields already exist")
                done();
            });
    });

    it("Failure: When denorm fields provided to delete does not exists", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", tags: ["tag1", "tag2"], denorm_config: {
                    denorm_fields: [{
                        "denorm_key": "actor.id",
                        "denorm_out_field": "id"
                    }]
                }
            })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.update");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Denorm fields do not exist to remove")
                done();
            });
    });
})