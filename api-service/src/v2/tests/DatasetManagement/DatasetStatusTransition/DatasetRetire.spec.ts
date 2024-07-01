import app from "../../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import _ from "lodash";
import { apiId, errorCode } from "../../../controllers/DatasetStatusTransition/DatasetStatusTransition";
import { TestInputsForDatasetStatusTransition } from "./Fixtures";
import { Dataset } from "../../../models/Dataset";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { DatasetTransformations } from "../../../models/Transformation";
import { DatasetSourceConfig } from "../../../models/DatasetSourceConfig";
import { Datasource } from "../../../models/Datasource";
import { commandHttpService } from "../../../connections/commandServiceConnection";
import { druidHttpService } from "../../../connections/druidConnection";
import { sequelize } from "../../../connections/databaseConnection";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6"

describe("DATASET STATUS TRANSITION RETIRE", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset status transition success: When the action is to Retire dataset", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "Live", type: "dataset" })
        })
        chai.spy.on(DatasetTransformations, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetSourceConfig, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Dataset, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(["telemetry"])
        })
        chai.spy.on(druidHttpService, "post", () => {
            return Promise.resolve({})
        })
        chai.spy.on(commandHttpService, "post", () => {
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
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to Retire successful")
                res.body.result.dataset_id.should.be.eq("telemetry")
                done();
            });
    });

    it("Dataset status transition success: When the action is to Retire master dataset", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "Live", type: "master-dataset" })
        })
        chai.spy.on(DatasetTransformations, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetSourceConfig, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Dataset, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve()
        })
        chai.spy.on(DatasetDraft, "findAll", () => {
            return Promise.resolve()
        })
        chai.spy.on(commandHttpService, "post", () => {
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
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to Retire successful")
                res.body.result.dataset_id.should.be.eq("telemetry")
                done();
            });
    });

    it("Dataset status transition successs: Dataset successfully retired on delete supervisors failure", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "Live", type: "dataset" })
        })
        chai.spy.on(DatasetTransformations, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetSourceConfig, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Dataset, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(["telemetry"])
        })
        chai.spy.on(druidHttpService, "post", () => {
            return Promise.reject({})
        })
        chai.spy.on(commandHttpService, "post", () => {
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
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to Retire successful")
                res.body.result.dataset_id.should.be.eq("telemetry")
                done();
            });
    });

    it("Dataset status transition failure: When dataset is not found to retire", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve()
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Dataset not found to retire")
                res.body.error.code.should.be.eq("DATASET_NOT_FOUND")
                done();
            })
    })

    it("Dataset status transition failure: When dataset is already retired", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "Retired", type: "dataset" })
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Failed to Retire dataset as it is not in live state")
                res.body.error.code.should.be.eq("DATASET_RETIRE_FAILURE")
                done();
            })
    })

    it("Dataset status transition failure: When dataset to retire is used by both live and draft datasets", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", type: "master-dataset", status: "Live" })
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ id: "telemetry", denorm_config: { denorm_fields: [{ dataset_id: "telemetry" }] } }])
        })
        chai.spy.on(DatasetDraft, "findAll", () => {
            return Promise.resolve([{ id: "telemetry", denorm_config: { denorm_fields: [{ dataset_id: "telemetry" }] } }])
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
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                expect(res.body.error.message).to.match(/^Failed to retire dataset as it is used by(.+)$/)
                res.body.error.code.should.be.eq("DATASET_IN_USE")
                done();
            });
    });

    it("Dataset status transition failure: When dataset to retire is used by live datasets", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", type: "master-dataset", status: "Live" })
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ id: "telemetry", denorm_config: { denorm_fields: [{ dataset_id: "telemetry" }] } }])
        })
        chai.spy.on(DatasetDraft, "findAll", () => {
            return Promise.resolve([])
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
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                expect(res.body.error.message).to.match(/^Failed to retire dataset as it is used by(.+)$/)
                res.body.error.code.should.be.eq("DATASET_IN_USE")
                done();
            });
    });

    it("Dataset status transition failure: When dataset to retire is used by draft datasets", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", type: "master-dataset", status: "Live" })
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([])
        })
        chai.spy.on(DatasetDraft, "findAll", () => {
            return Promise.resolve([{ id: "telemetry", denorm_config: { denorm_fields: [{ dataset_id: "telemetry" }] } }])
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
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                expect(res.body.error.message).to.match(/^Failed to retire dataset as it is used by(.+)$/)
                res.body.error.code.should.be.eq("DATASET_IN_USE")
                done();
            });
    });

    it("Dataset status transition failure: When setting retire status to live records fail", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "Live", type: "dataset" })
        })
        chai.spy.on(Dataset, "update", () => {
            return Promise.reject({})
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
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq(errorCode)
                res.body.error.message.should.be.eq("Failed to perform status transition on datasets")
                done();
            });
    });

    it("Dataset status transition failure: Failed to restart pipeline", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", type: "dataset", status: "Live", })
        })
        chai.spy.on(DatasetTransformations, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetSourceConfig, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Dataset, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(["telemetry"])
        })
        chai.spy.on(commandHttpService, "post", () => {
            return Promise.reject({})
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
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq(errorCode)
                res.body.error.message.should.be.eq("Failed to perform status transition on datasets")
                done();
            });
    });
})