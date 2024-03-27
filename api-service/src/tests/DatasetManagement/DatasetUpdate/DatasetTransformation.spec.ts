import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import { DatasetDraft } from "../../../models/DatasetDraft";
import _ from "lodash";
import { TestInputsForDatasetUpdate } from "./Fixtures";
import { DatasetTransformationsDraft } from "../../../models/TransformationDraft";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("Dataset transformation update", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Success: Dataset transformations successfully added", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "", status: "Draft"
            })
        })
        chai.spy.on(DatasetTransformationsDraft, "findAll", () => {
            return Promise.resolve([])
        })
        chai.spy.on(DatasetTransformationsDraft, "bulkCreate", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_TRANSFORMATIONS_ADD)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                done();
            });
    });

    it("Success: Dataset transformations successfully removed", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "", status: "Draft"
            })
        })
        chai.spy.on(DatasetTransformationsDraft, "findAll", () => {
            return Promise.resolve([{ field_key: "key1" }, { field_key: "key3" }])
        })
        chai.spy.on(DatasetTransformationsDraft, "destroy", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_TRANSFORMATIONS_REMOVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                done();
            });
    });

    it("Success: Dataset transformations successfully updated", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "", status: "Draft"
            })
        })
        chai.spy.on(DatasetTransformationsDraft, "findAll", () => {
            return Promise.resolve([{ field_key: "key1" }, { field_key: "key3" }])
        })
        chai.spy.on(DatasetTransformationsDraft, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_TRANSFORMATIONS_UPDATE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                done();
            });
    });

    it("Success: When payload contains same transformation field_key to be added, updated or removed", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ id: "", status: "Draft" })
        })
        chai.spy.on(DatasetTransformationsDraft, "findAll", () => {
            return Promise.resolve([{ field_key: "key2" }, { field_key: "key3" }])
        })
        chai.spy.on(DatasetTransformationsDraft, "bulkCreate", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetTransformationsDraft, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetTransformationsDraft, "destroy", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_WITH_SAME_TRANSFORMATION_ADD_REMOVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                done();
            });
    });

    it("Failure: When transformation fields provided to add already exists", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "", status: "Draft", tags: ["tag1", "tag2"], denorm_config: {
                    denorm_fields: [{
                        "denorm_key": "actor.id",
                        "denorm_out_field": "mid"
                    }]
                }
            })
        })
        chai.spy.on(DatasetTransformationsDraft, "findAll", () => {
            return Promise.resolve([{ field_key: "key1" }, { field_key: "key3" }])
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Dataset transformations already exists")
                done();
            });
    });

    it("Failure: When transformation fields provided to update do not exists", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "", status: "Draft", tags: ["tag1", "tag2"], denorm_config: {
                    denorm_fields: [{
                        "denorm_key": "actor.id",
                        "denorm_out_field": "mid"
                    }]
                }
            })
        })
        chai.spy.on(DatasetTransformationsDraft, "findAll", () => {
            return Promise.resolve([{ field_key: "key7" }, { field_key: "key2" }])
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Dataset transformations do not exist to update")
                done();
            });
    });

    it("Failure: When transformation fields provided to remove do not exists", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "", status: "Draft", tags: ["tag1", "tag2"], denorm_config: {
                    denorm_fields: [{
                        "denorm_key": "actor.id",
                        "denorm_out_field": "mid"
                    }]
                }
            })
        })
        chai.spy.on(DatasetTransformationsDraft, "findAll", () => {
            return Promise.resolve([{ field_key: "key7" }, { field_key: "key3" }])
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Dataset transformations do not exist to remove")
                done();
            });
    });
})