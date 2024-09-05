import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { TestInputsForDatasetCreate, DATASET_CREATE_SUCCESS_FIXTURES, DATASET_FAILURE_DUPLICATE_DENORM_FIXTURES } from "./Fixtures";
import { describe, it } from "mocha";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { sequelize } from "../../../connections/databaseConnection";
import { apiId } from "../../../controllers/DatasetCreate/DatasetCreate"
import { Dataset } from "../../../models/Dataset";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6d"

describe("DATASET CREATE API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    for (const fixture of DATASET_CREATE_SUCCESS_FIXTURES) {
        it(fixture.title, (done) => {
            chai.spy.on(DatasetDraft, "findOne", () => {
                return Promise.resolve(null)
            })
            chai.spy.on(Dataset, "findOne", () => {
                return Promise.resolve(null)
            })
            chai.spy.on(DatasetDraft, "create", () => {
                return Promise.resolve({ dataValues: { id: "telemetry" } })
            })
            
            chai
                .request(app)
                .post("/v2/datasets/create")
                .send(fixture.requestPayload)
                .end((err, res) => {
                    res.should.have.status(fixture.httpStatus);
                    res.body.should.be.a("object")
                    res.body.id.should.be.eq(apiId);
                    res.body.params.status.should.be.eq(fixture.status)
                    res.body.params.msgid.should.be.eq(fixture.msgid)
                    res.body.result.id.should.be.eq("telemetry")
                    res.body.result.version_key.should.be.a("string")
                    done();
                });
        });
    }

    for (const fixture of DATASET_FAILURE_DUPLICATE_DENORM_FIXTURES) {
        it(fixture.title, (done) => {
            chai.spy.on(DatasetDraft, "findOne", () => {
                return Promise.resolve(null)
            })
            chai.spy.on(Dataset, "findOne", () => {
                return Promise.resolve(null)
            })
            
            chai
                .request(app)
                .post("/v2/datasets/create")
                .send(fixture.requestPayload)
                .end((err, res) => {
                    res.should.have.status(fixture.httpStatus);
                    res.body.should.be.a("object")
                    res.body.id.should.be.eq(apiId);
                    res.body.params.status.should.be.eq(fixture.status)
                    res.body.params.msgid.should.be.eq(fixture.msgid)
                    res.body.error.message.should.be.eq("Duplicate denorm output fields found.")
                    res.body.error.code.should.be.eq("DATASET_DUPLICATE_DENORM_KEY")
                    done();
                });
        });
    }

    it("Dataset creation failure: Invalid request payload provided", (done) => {
        chai
            .request(app)
            .post("/v2/datasets/create")
            .send(TestInputsForDatasetCreate.SCHEMA_VALIDATION_ERROR_DATASET)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.msgid.should.be.eq(msgid)
                res.body.params.status.should.be.eq("FAILED")
                expect(res.body.error.message).to.match(/^#properties\/request(.+)$/)
                res.body.error.code.should.be.eq("DATASET_INVALID_INPUT")
                done();
            });
    });

    it("Dataset creation failure: Dataset with given dataset_id already exists", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ datavalues: [] })
        })
        
        chai
            .request(app)
            .post("/v2/datasets/create")
            .send(TestInputsForDatasetCreate.DATASET_WITH_DUPLICATE_DENORM_KEY)
            .end((err, res) => {
                res.should.have.status(httpStatus.CONFLICT);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Dataset Already exists with id:sb-ddd")
                res.body.error.code.should.be.eq("DATASET_EXISTS")
                done();
            });
    });
})