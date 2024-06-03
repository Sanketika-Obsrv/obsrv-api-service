import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import _ from "lodash";
import { apiId, errorCode } from "../../../controllers/DatasetStatusTransition/DatasetStatusTransition";
import { TestInputsForDatasetStatusTransition } from "./Fixtures";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { sequelize } from "../../../connections/databaseConnection";


chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6"

describe("DATASET STATUS TRANSITION API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset status transition failure: Invalid request payload provided", (done) => {
        chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve(sequelize.transaction)
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.INVALID_SCHEMA)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                expect(res.body.error.message).to.match(/^(.+) should be equal to one of the allowed values$/)
                res.body.error.code.should.be.eq("DATASET_STATUS_TRANSITION_INVALID_INPUT")
                done();
            });
    });

    it("Dataset status transition failure: Connection to the database failed", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
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
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_DELETE)
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