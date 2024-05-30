import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import _ from "lodash";
import { apiId, commandHttpService, errorCode } from "../../../controllers/DatasetStatus/DatasetStatus";
import { TestInputsForDatasetStatus } from "./Fixtures";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { DatasetTransformationsDraft } from "../../../models/TransformationDraft";
import { DatasetSourceConfigDraft } from "../../../models/DatasetSourceConfigDraft";
import { DatasourceDraft } from "../../../models/DatasourceDraft";
import { sequelize } from "../../../connections/databaseConnection";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6"

describe("DATASET STATUS PUBLISH", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset status success: When the action is to Publish dataset", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "Publish" })
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
            .send(TestInputsForDatasetStatus.VALID_SCHEMA_FOR_PUBLISH)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset published successfully")
                res.body.result.dataset_id.should.be.eq("telemetry.1")
                done();
            });
    });

    it("Dataset status failure: When dataset is not found to publish", (done) => {
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
            .post("/v2/datasets/status")
            .send(TestInputsForDatasetStatus.VALID_SCHEMA_FOR_PUBLISH)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Dataset not found to publish")
                res.body.error.code.should.be.eq("DATASET_NOT_FOUND")
                done();
            })
    })

    it("Dataset status failure: When the command api call to publish dataset fails", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "Publish" })
        })
        chai.spy.on(commandHttpService, "post", () => {
            return Promise.reject()
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
            .send(TestInputsForDatasetStatus.VALID_SCHEMA_FOR_PUBLISH)
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

    it("Dataset status failure: When the dataset to publish is in draft state", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "Draft" })
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
            .send(TestInputsForDatasetStatus.VALID_SCHEMA_FOR_PUBLISH)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq("DATASET_NOT_READY_FOR_PUBLISH")
                res.body.error.message.should.be.eq("Failed to publish dataset as it is in draft state")
                done();
            });
    });

})