import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { TestInputsForDatasetCreate, DATASET_CREATE_SUCCESS_FIXTURES, DATASET_FAILURE_DUPLICATE_DENORM_FIXTURES } from "./Fixtures";
import { describe, it } from 'mocha';
import { DatasetDraft } from "../../../models/DatasetDraft";
import { sequelize } from "../../../connections/databaseConnection";
import _ from "lodash";
import { apiId } from "../../../controllers/DatasetCreate/DatasetCreate"
import { DatasourceDraft } from "../../../models/DatasourceDraft";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6d"

describe("DATASET CREATE API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    for (let fixture of DATASET_CREATE_SUCCESS_FIXTURES) {
        it(fixture.title, (done) => {
            chai.spy.on(DatasetDraft, "findOne", () => {
                return Promise.resolve(null)
            })
            chai.spy.on(sequelize, "query", () => {
                return Promise.resolve([{ nextVal: 9 }])
            })
            chai.spy.on(DatasourceDraft, "create", () => {
                return Promise.resolve({})
            })
            chai.spy.on(DatasetDraft, "create", () => {
                return Promise.resolve({ dataValues: { id: "telemetry" } })
            })
            const t = chai.spy.on(sequelize, "transaction", () => {
                return Promise.resolve(sequelize.transaction)
            })
            chai.spy.on(t, "commit", () => {
                return Promise.resolve({})
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

    for (let fixture of DATASET_FAILURE_DUPLICATE_DENORM_FIXTURES) {
        it(fixture.title, (done) => {
            chai.spy.on(DatasetDraft, "findOne", () => {
                return Promise.resolve(null)
            })
            chai.spy.on(sequelize, "transaction", () => {
                return Promise.resolve({})
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
                    res.body.error.message.should.be.eq("Duplicate denorm key found")
                    res.body.error.code.should.be.eq("DATASET_DUPLICATE_DENORM_KEY")
                    done();
                });
        });
    }

    it("Dataset creation failure: Invalid request payload provided", (done) => {
        chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve({})
        })
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
                expect(res.body.error.message).to.match(/^(.+)should be string$/)
                res.body.error.code.should.be.eq("DATASET_INVALID_INPUT")
                done();
            });
    });

    it("Dataset creation failure: Dataset with given dataset_id already exists", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ datavalues: [] })
        })
        chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve({})
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
                res.body.error.message.should.be.eq("Dataset already exists")
                res.body.error.code.should.be.eq("DATASET_EXISTS")
                done();
            });
    });

    it("Dataset creation failure: When timestamp key does not exist in the data schema", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(null)
        })
        chai.spy.on(sequelize, "query", () => {
            return Promise.resolve([{ nextVal: 9 }])
        })
        chai.spy.on(DatasetDraft, "create", () => {
            return Promise.resolve({ dataValues: { id: "telemetry" } })
        })
        const t = chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve(sequelize.transaction)
        })
        chai.spy.on(t, "rollback", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v2/datasets/create")
            .send(TestInputsForDatasetCreate.DATASET_WITH_INVALID_TIMESTAMP)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Provided timestamp key not found in the data schema")
                res.body.error.code.should.be.eq("DATASET_TIMESTAMP_NOT_FOUND")
                done();
            });
    });

    it("Dataset creation failure: Connection to the database failed", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
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
            .post("/v2/datasets/create")
            .send(TestInputsForDatasetCreate.DATASET_WITH_DUPLICATE_DENORM_KEY)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Failed to create dataset")
                res.body.error.code.should.be.eq("DATASET_CREATION_FAILURE")
                done();
            });
    });

})