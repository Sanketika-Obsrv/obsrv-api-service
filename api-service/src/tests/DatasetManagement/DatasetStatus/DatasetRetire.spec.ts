import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import _ from "lodash";
import { apiId, commandHttpService, druidHttpService, errorCode } from "../../../controllers/DatasetStatus/DatasetStatus";
import { TestInputsForDatasetStatus } from "./Fixtures";
import { Dataset } from "../../../models/Dataset";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { DatasetTransformations } from "../../../models/Transformation";
import { sequelize } from "../../../connections/databaseConnection";
import { DatasetSourceConfig } from "../../../models/DatasetSourceConfig";
import { Datasource } from "../../../models/Datasource";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6"

describe("DATASET STATUS RETIRE", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset status success: When the action is to Retire dataset", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry" })
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
            return Promise.resolve(["telemetry.1"])
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
            .post("/v2/datasets/status")
            .send(TestInputsForDatasetStatus.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset retired successfully")
                res.body.result.dataset_id.should.be.eq("telemetry.1")
                done();
            });
    });

    it("Dataset status failure: When dataset is not found to retire", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
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
            .post("/v2/datasets/status")
            .send(TestInputsForDatasetStatus.VALID_SCHEMA_FOR_RETIRE)
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

    it("Dataset status failure: When dataset to retire is used by other datasets", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", type: "master-dataset" })
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ dataset_id: "telemetry" }])
        })
        chai.spy.on(DatasetDraft, "findAll", () => {
            return Promise.resolve([{ dataset_id: "telemetry" }])
        })
        const t = chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve(sequelize.transaction)
        })
        chai.spy.on(t, "rollback", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v2/datasets/status")
            .send(TestInputsForDatasetStatus.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Failed to retire dataset as it is used by other datasets")
                res.body.error.code.should.be.eq("DATASET_IN_USE")
                done();
            });
    });

    it("Dataset status failure: When setting retire status to live records fail", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve([{ dataset_id: "telemetry" }])
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
            .post("/v2/datasets/status")
            .send(TestInputsForDatasetStatus.VALID_SCHEMA_FOR_RETIRE)
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

    it("Dataset status failure: Failed to delete supervisors", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve([{ dataset_id: "telemetry" }])
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
            return Promise.resolve(["telemetry.1"])
        })
        chai.spy.on(druidHttpService, "post", () => {
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
            .post("/v2/datasets/status")
            .send(TestInputsForDatasetStatus.VALID_SCHEMA_FOR_RETIRE)
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

    it("Dataset status failure: Failed to restart pipeline", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve([{ dataset_id: "telemetry" }])
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
            return Promise.resolve(["telemetry.1"])
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
            .post("/v2/datasets/status")
            .send(TestInputsForDatasetStatus.VALID_SCHEMA_FOR_RETIRE)
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