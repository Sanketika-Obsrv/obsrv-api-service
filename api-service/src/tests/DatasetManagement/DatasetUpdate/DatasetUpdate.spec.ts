import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import { DatasetDraft } from "../../../models/DatasetDraft";
import _ from "lodash";
import { TestInputsForDatasetUpdate, msgid, requestStructure } from "./Fixtures";
import { DatasetTransformationsDraft } from "../../../models/TransformationDraft";
import { apiId, errorCode, invalidInputErrCode } from "../../../controllers/DatasetUpdate/DatasetUpdate"

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("DATASET UPDATE API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset updation success: When minimal request payload provided", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ id: "telemetry", status: "Draft", version_key: "1713444815918" })
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
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                res.body.result.version_key.should.be.a("string")
                done();
            });
    });

    it("Dataset updation success: When full request payload provided", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft", version_key: "1713444815918", tags: ["tag1", "tag2"], denorm_config: {
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
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                res.body.result.version_key.should.be.a("string")
                done();
            });
    });

    it("Dataset updation failure: When no fields with dataset_id is provided in the request payload", (done) => {
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send({ ...requestStructure, request: { dataset_id: "telemetry", version_key: "1713444815918" } })
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Provide atleast one field in addition to the dataset_id to update the dataset")
                res.body.error.code.should.be.eq("DATASET_UPDATE_NO_FIELDS")
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
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Dataset does not exists to update")
                res.body.error.code.should.be.eq("DATASET_NOT_EXISTS")
                done();
            });
    });

    it("Dataset updation failure: When dataset to update is outdated", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ id: "telemetry", status: "Draft", version_key: "1813444815918" })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send({ ...requestStructure, request: { dataset_id: "telemetry", version_key: "1713444815918", name: "telemetry" } })
            .end((err, res) => {
                res.should.have.status(httpStatus.CONFLICT);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("The dataset is outdated. Please try to fetch latest changes of the dataset and perform the updates")
                res.body.error.code.should.be.eq("DATASET_OUTDATED")
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
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Dataset cannot be updated as it is not in draft state")
                res.body.error.code.should.be.eq("DATASET_NOT_IN_DRAFT_STATE_TO_UPDATE")
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
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Failed to update dataset")
                res.body.error.code.should.be.eq(errorCode)
                done();
            });
    });

    describe("Dataset name update", () => {

        afterEach(() => {
            chai.spy.restore();
        });

        it("Success: Dataset name updated successfully", (done) => {
            chai.spy.on(DatasetDraft, "findOne", () => {
                return Promise.resolve({ id: "telemetry", status: "Draft", version_key: "1713444815918" })
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
                    res.body.id.should.be.eq(apiId);
                    res.body.params.status.should.be.eq("SUCCESS")
                    res.body.params.msgid.should.be.eq(msgid)
                    res.body.result.id.should.be.eq("telemetry")
                    res.body.result.message.should.be.eq("Dataset is updated successfully")
                    res.body.result.version_key.should.be.a("string")
                    done();
                });
        });

        it("Failure: Failed to update the dataset name", (done) => {
            chai
                .request(app)
                .patch("/v1/datasets/update")
                .send({ ...requestStructure, request: { dataset_id: "telemetry", name: {}, version_key: "1713444815918" } })
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object")
                    res.body.id.should.be.eq(apiId);
                    res.body.params.status.should.be.eq("FAILED")
                    res.body.params.msgid.should.be.eq(msgid)
                    expect(res.body.error.message).to.match(/^(.+)should be string$/)
                    res.body.error.code.should.be.eq(invalidInputErrCode)
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
                    id: "telemetry", status: "Draft", version_key: "1713444815918"
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
                    res.body.id.should.be.eq(apiId);
                    res.body.params.status.should.be.eq("SUCCESS")
                    res.body.params.msgid.should.be.eq(msgid)
                    res.body.result.id.should.be.eq("telemetry")
                    res.body.result.message.should.be.eq("Dataset is updated successfully")
                    res.body.result.version_key.should.be.a("string")
                    done();
                });
        });

        it("Failure: Failed to update data schema", (done) => {
            chai
                .request(app)
                .patch("/v1/datasets/update")
                .send({ ...requestStructure, request: { dataset_id: "sb-telemetry", version_key: "1713444815918", data_schema: { a: "" } } })
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object")
                    res.body.id.should.be.eq(apiId);
                    res.body.params.status.should.be.eq("FAILED")
                    res.body.params.msgid.should.be.eq(msgid)
                    expect(res.body.error.message).to.match(/^(.+)should NOT have additional properties$/)
                    res.body.error.code.should.be.eq(invalidInputErrCode)
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
                    id: "telemetry", status: "Draft", version_key: "1713444815918"
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
                    res.body.id.should.be.eq(apiId);
                    res.body.params.status.should.be.eq("SUCCESS")
                    res.body.params.msgid.should.be.eq(msgid)
                    res.body.result.id.should.be.eq("telemetry")
                    res.body.result.message.should.be.eq("Dataset is updated successfully")
                    res.body.result.version_key.should.be.a("string")
                    done();
                });
        });

        it("Failure: Failed to update dataset config", (done) => {
            chai
                .request(app)
                .patch("/v1/datasets/update")
                .send({ ...requestStructure, request: { dataset_id: "telemetry", version_key: "1713444815918", dataset_config: { new: 1 } } })
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object")
                    res.body.id.should.be.eq(apiId);
                    res.body.params.status.should.be.eq("FAILED")
                    res.body.params.msgid.should.be.eq(msgid)
                    expect(res.body.error.message).to.match(/^(.+)should NOT have additional properties$/)
                    res.body.error.code.should.be.eq(invalidInputErrCode)
                    done();
                });
        });
    })
})