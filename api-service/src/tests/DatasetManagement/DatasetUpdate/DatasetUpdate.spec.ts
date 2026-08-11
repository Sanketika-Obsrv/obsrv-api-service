import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from "mocha";
import { DatasetDraft } from "../../../models/DatasetDraft";
import _ from "lodash";
import { TestInputsForDatasetUpdate, msgid, requestStructure, validVersionKey } from "./Fixtures";
import { DatasetTransformationsDraft } from "../../../models/TransformationDraft";
import { apiId, invalidInputErrCode } from "../../../controllers/DatasetUpdate/DatasetUpdate"
import { sequelize } from "../../../connections/databaseConnection";
import { userService } from "../../../services/UserService";
import { config } from "../../../configs/Config";
import { buildRbacToken, NO_ACCESS_ROLE } from "../../helpers/rbacTestHelper";


chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("DATASET UPDATE API", () => {

    afterEach(() => {
        chai.spy.restore();
        config.is_RBAC_enabled = "false";
    });

    it("Dataset updation success: When minimal request payload provided", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ id: "telemetry", status: "Draft", version_key: validVersionKey, type: "event", api_version: "v2" })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })

        chai
            .request(app)
            .patch("/v2/datasets/update")
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
                id: "telemetry", status: "Draft", type: "event", version_key: validVersionKey, tags: ["tag1", "tag2"], denorm_config: {
                    denorm_fields: [{
                        "denorm_key": "actor.id",
                        "denorm_out_field": "mid",
                        "dataset_id" : "master-telemetry",
                        "redis_db": 10
                    }]
                }, api_version: "v2"
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })

        chai
            .request(app)
            .patch("/v2/datasets/update")
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
            .patch("/v2/datasets/update")
            .send({ ...requestStructure, request: { dataset_id: "telemetry", version_key: validVersionKey } })
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
            .patch("/v2/datasets/update")
            .send(TestInputsForDatasetUpdate.MINIMAL_DATASET_UPDATE_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Dataset does not exists with id:telemetry")
                res.body.error.code.should.be.eq("DATASET_NOT_EXISTS")
                done();
            });
    });

    it("Dataset updation failure: When dataset to update is outdated", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ id: "telemetry", type: "event", status: "Draft", version_key: "1813444815918", api_version: "v2" })
        })

        chai
            .request(app)
            .patch("/v2/datasets/update")
            .send({ ...requestStructure, request: { dataset_id: "telemetry", version_key: validVersionKey, name: "telemetry" } })
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

    it("Dataset updation failure: When dataset to update is of api_version v1", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ id: "telemetry", type: "event", status: "Draft", version_key: "1813444815918", api_version: "v1" })
        })

        chai
            .request(app)
            .patch("/v2/datasets/update")
            .send({ ...requestStructure, request: { dataset_id: "telemetry", version_key: validVersionKey, name: "telemetry" } })
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Draft dataset api version is not v2. Perform a read api call with mode=edit to migrate the dataset")
                res.body.error.code.should.be.eq("DATASET_API_VERSION_MISMATCH")
                done();
            });
    });

    it("Dataset updation failure: Dataset to update is not in draft state", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ id: "telemetry", type: "event", status: "Live", version_key: "1713444815918", api_version: "v2" })
        })

        chai
            .request(app)
            .patch("/v2/datasets/update")
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
            .patch("/v2/datasets/update")
            .send(TestInputsForDatasetUpdate.MINIMAL_DATASET_UPDATE_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.code.should.be.eq("INTERNAL_SERVER_ERROR")
                done();
            });
    });

    describe("Dataset name update", () => {

        afterEach(() => {
            chai.spy.restore();
        });

        it("Success: Dataset name updated successfully", (done) => {
            chai.spy.on(DatasetDraft, "findOne", () => {
                return Promise.resolve({ id: "telemetry", status: "Draft", version_key: validVersionKey, type: "event", api_version: "v2" })
            })
            chai.spy.on(DatasetDraft, "update", () => {
                return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
            })
            chai
                .request(app)
                .patch("/v2/datasets/update")
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
                .patch("/v2/datasets/update")
                .send({ ...requestStructure, request: { dataset_id: "telemetry", name: {}, version_key: validVersionKey } })
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
    })

    describe("Dataset data schema update", () => {

        afterEach(() => {
            chai.spy.restore();
        });

        it("Success: Dataset data schema updated successfully", (done) => {
            chai.spy.on(DatasetDraft, "findOne", () => {
                return Promise.resolve({
                    id: "telemetry", status: "Draft", version_key: validVersionKey, type: "event", api_version: "v2"
                })
            })
            chai.spy.on(DatasetDraft, "update", () => {
                return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
            })
            chai
                .request(app)
                .patch("/v2/datasets/update")
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
                .patch("/v2/datasets/update")
                .send({ ...requestStructure, request: { dataset_id: "sb-telemetry", version_key: validVersionKey, data_schema: { a: "" } } })
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
    })

    describe("Dataset dataset_config update", () => {

        afterEach(() => {
            chai.spy.restore();
        });

        it("Success: Dataset config updated successfully", (done) => {
            chai.spy.on(DatasetDraft, "findOne", () => {
                return Promise.resolve({
                    id: "telemetry", status: "Draft", version_key: validVersionKey, type: "event", api_version: "v2"
                })
            })
            chai.spy.on(DatasetDraft, "update", () => {
                return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
            })
            chai
                .request(app)
                .patch("/v2/datasets/update")
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
                .patch("/v2/datasets/update")
                .send({ ...requestStructure, request: { dataset_id: "telemetry", version_key: validVersionKey, dataset_config: { new: 1 } } })
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
    })

    it("Dataset updation failure: RBAC enabled and user lacks a valid role", (done) => {
        config.is_RBAC_enabled = "true";
        chai.spy.on(userService, "getUser", () => {
            return Promise.resolve({ roles: [NO_ACCESS_ROLE] })
        })
        chai
            .request(app)
            .patch("/v2/datasets/update")
            .set("Authorization", `Bearer ${buildRbacToken()}`)
            .send(TestInputsForDatasetUpdate.MINIMAL_DATASET_UPDATE_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.FORBIDDEN);
                done();
            });
    });
})