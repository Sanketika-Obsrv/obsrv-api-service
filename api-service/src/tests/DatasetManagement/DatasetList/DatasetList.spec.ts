import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from "mocha";
import _ from "lodash";
import { apiId } from "../../../controllers/DatasetList/DatasetList";
import { TestInputsForDatasetList } from "./Fixtures";
import { Dataset } from "../../../models/Dataset";
import { DatasetDraft } from "../../../models/DatasetDraft";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6d"

describe("DATASET LIST API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset list success: When no filters are provided", (done) => {
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([TestInputsForDatasetList.VALID_LIVE_DATASET_SCHEMA])
        })
        chai.spy.on(DatasetDraft, "findAll", () => {
            return Promise.resolve([TestInputsForDatasetList.VALID_DRAFT_DATASET_SCHEMA])
        })
        chai
            .request(app)
            .post("/v2/datasets/list")
            .send(TestInputsForDatasetList.REQUEST_WITHOUT_FILTERS)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.count.should.be.eq(2)
                res.body.params.msgid.should.be.eq(msgid)
                const result = JSON.stringify(res.body.result.data)
                const expectedResult = JSON.stringify(TestInputsForDatasetList.VALID_RESPONSE)
                result.should.be.eq(expectedResult)
                done();
            });
    });

    it("Dataset list success: When status filter provided in request payload", (done) => {
        chai.spy.on(DatasetDraft, "findAll", () => {
            return Promise.resolve([TestInputsForDatasetList.VALID_DRAFT_DATASET_SCHEMA])
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([])
        })
        chai
            .request(app)
            .post("/v2/datasets/list")
            .send(TestInputsForDatasetList.REQUEST_WITH_STATUS_FILTERS)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.count.should.be.eq(1)
                res.body.params.msgid.should.be.eq(msgid)
                const result = JSON.stringify(res.body.result.data)
                const expectedResult = JSON.stringify([{ ...TestInputsForDatasetList.VALID_DRAFT_DATASET_SCHEMA }])
                result.should.be.eq(expectedResult)
                done();
            });
    });

    it("Dataset list success: When type filter provided in request payload", (done) => {
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([TestInputsForDatasetList.VALID_LIVE_DATASET_SCHEMA])
        })
        chai.spy.on(DatasetDraft, "findAll", () => {
            return Promise.resolve([])
        })
        chai
            .request(app)
            .post("/v2/datasets/list")
            .send(TestInputsForDatasetList.REQUEST_WITH_TYPE_FILTERS)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.count.should.be.eq(1)
                res.body.params.msgid.should.be.eq(msgid)
                const result = JSON.stringify(res.body.result.data)
                const expectedResult = JSON.stringify([{ ...TestInputsForDatasetList.VALID_LIVE_DATASET_SCHEMA}])
                result.should.be.eq(expectedResult)
                done();
            });
    });

    it("Dataset list failure: Invalid request payload provided", (done) => {
        chai
            .request(app)
            .post("/v2/datasets/list")
            .send(TestInputsForDatasetList.INVALID_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq("DATASET_LIST_INPUT_INVALID")
                expect(res.body.error.message).to.match(/^(.+) must be equal to one of the allowed values$/)
                done();
            });
    });

})