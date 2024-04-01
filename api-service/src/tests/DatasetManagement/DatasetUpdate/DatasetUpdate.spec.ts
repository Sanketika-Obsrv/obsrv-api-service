import app from "../../../app";
import chai, { expect } from "chai";
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

describe("DATASET UPDATE API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset updation success: When minimal request payload provided", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ id: "telemetry", status: "Draft" })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.MINIMAL_DATASET_UPDATE_REQUEST)
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

    it("Dataset updation success: When full request payload provided", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", tags: ["tag1", "tag2"], denorm_config: {
                    denorm_fields: [{
                        "denorm_key": "actor.id",
                        "denorm_out_field": "mid"
                    }]
                }
            })
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
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_REQUEST)
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

    it("Dataset updation failure: When no fields with dataset_id is provided in the request payload", (done) => {
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send({ dataset_id: "telemetry" })
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.dataset.update");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Provide atleast one field in addition to the dataset_id to update the dataset")
                done();
            });
    });

    it("Dataset updation failure: Dataset does not exists to update", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(null)
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.MINIMAL_DATASET_UPDATE_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.dataset.update");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Dataset does not exists to update")
                done();
            });
    });

    it("Dataset updation failure: Dataset to update is not in draft state", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ status: "Live" })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.MINIMAL_DATASET_UPDATE_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.dataset.update");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Dataset cannot be updated as it is not in draft state")
                done();
            });
    });

    it("Dataset updation failure: Connection to the database failed", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.reject({})
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.MINIMAL_DATASET_UPDATE_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.dataset.update");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Failed to update dataset")
                done();
            });
    });

    describe("Dataset name update", () => {

        afterEach(() => {
            chai.spy.restore();
        });

        it("Success: Dataset name updated successfully", (done) => {
            chai.spy.on(DatasetDraft, "findOne", () => {
                return Promise.resolve({ id: "telemetry", status: "Draft" })
            })
            chai.spy.on(DatasetDraft, "update", () => {
                return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
            })
            chai
                .request(app)
                .patch("/v1/datasets/update")
                .send(TestInputsForDatasetUpdate.MINIMAL_DATASET_UPDATE_REQUEST)
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

        it("Failure: Failed to update the dataset name", (done) => {
            chai
                .request(app)
                .patch("/v1/datasets/update")
                .send({ dataset_id: "telemetry", name: {} })
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object")
                    res.body.id.should.be.eq("api.dataset.update");
                    res.body.params.status.should.be.eq("FAILED")
                    expect(res.body.params.errmsg).to.match(/^(.+)should be string$/)
                    done();
                });
        });
    })

    describe("Dataset data schema update", () => {

        afterEach(() => {
            chai.spy.restore();
        });

        it("Success: Dataset data schema updated successfully", (done) => {
            chai.spy.on(DatasetDraft, "findOne", () => {
                return Promise.resolve({
                    id: "telemetry", status: "Draft"
                })
            })
            chai.spy.on(DatasetDraft, "update", () => {
                return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
            })
            chai
                .request(app)
                .patch("/v1/datasets/update")
                .send(TestInputsForDatasetUpdate.DATASET_UPDATE_DATA_SCHEMA_VALID)
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

        it("Failure: Failed to update data schema", (done) => {
            chai
                .request(app)
                .patch("/v1/datasets/update")
                .send({ dataset_id: "sb-telemetry", data_schema: { a: "" } })
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object")
                    res.body.id.should.be.eq("api.dataset.update");
                    res.body.params.status.should.be.eq("FAILED")
                    expect(res.body.params.errmsg).to.match(/^(.+)should NOT have additional properties$/)
                    done();
                });
        });
    })

    describe("Dataset dataset_config update", () => {

        afterEach(() => {
            chai.spy.restore();
        });

        it("Success: Dataset config updated successfully", (done) => {
            chai.spy.on(DatasetDraft, "findOne", () => {
                return Promise.resolve({
                    id: "telemetry", status: "Draft"
                })
            })
            chai.spy.on(DatasetDraft, "update", () => {
                return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
            })
            chai
                .request(app)
                .patch("/v1/datasets/update")
                .send(TestInputsForDatasetUpdate.DATASET_UPDATE_DATASET_CONFIG_VALID)
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

        it("Failure: Failed to update dataset config", (done) => {
            chai
                .request(app)
                .patch("/v1/datasets/update")
                .send({ dataset_id: "telemetry", dataset_config: { new: 1 } })
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object")
                    res.body.id.should.be.eq("api.dataset.update");
                    res.body.params.status.should.be.eq("FAILED")
                    expect(res.body.params.errmsg).to.match(/^(.+)should NOT have additional properties$/)
                    done();
                });
        });
    })
})