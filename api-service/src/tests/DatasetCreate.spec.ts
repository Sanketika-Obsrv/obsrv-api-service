import app from "../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { DATASET_WITH_DUPLICATE_DENORM_KEY, SCHEMA_VALIDATION_ERROR_DATASET, DATASET_CREATE_SUCCESS_FIXTURES, DATASET_FAILURE_DUPLICATE_DENORM_FIXTURES } from "./Fixtures";
import { describe, it } from 'mocha';
import { DatasetDraft } from "../models/DatasetDraft";
import { sequelize } from "../connections/databaseConnection";
import _ from "lodash";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("Dataset create API", () => {

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
            chai.spy.on(DatasetDraft, "create", () => {
                return Promise.resolve({ dataValues: { id: "" } })
            })
            chai
                .request(app)
                .post("/v1/datasets/create")
                .send(fixture.requestPayload)
                .end((err, res) => {
                    res.should.have.status(fixture.httpStatus);
                    res.body.should.be.a("object")
                    res.body.id.should.be.eq("api");
                    res.body.params.status.should.be.eq(fixture.status)
                    res.body.result.id.should.be.eq("")
                    done();
                });
        });
    }

    for (let fixture of DATASET_FAILURE_DUPLICATE_DENORM_FIXTURES) {
        it(fixture.title, (done) => {
            chai.spy.on(DatasetDraft, "findOne", () => {
                return Promise.resolve(null)
            })
            chai
                .request(app)
                .post("/v1/datasets/create")
                .send(fixture.requestPayload)
                .end((err, res) => {
                    res.should.have.status(fixture.httpStatus);
                    res.body.should.be.a("object")
                    res.body.id.should.be.eq("api");
                    res.body.params.status.should.be.eq(fixture.status)
                    res.body.params.errmsg.should.be.eq("Duplicate denorm output fields found")
                    done();
                });
        });
    }

    it("Dataset creation failed due to request body schema validation failure", (done) => {
        chai
            .request(app)
            .post("/v1/datasets/create")
            .send(SCHEMA_VALIDATION_ERROR_DATASET)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq(400)
                done();
            });
    });

    it("Dataset creation failed as the dataset with given dataset_id already exists", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ datavalues: [] })
        })
        chai
            .request(app)
            .post("/v1/datasets/create")
            .send(DATASET_WITH_DUPLICATE_DENORM_KEY)
            .end((err, res) => {
                res.should.have.status(httpStatus.CONFLICT);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq(409)
                res.body.params.errmsg.should.be.eq("Dataset Already exists")
                done();
            });
    });

    it("Dataset creation failure due to database connection failure", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.reject({})
        })
        chai
            .request(app)
            .post("/v1/datasets/create")
            .send(DATASET_WITH_DUPLICATE_DENORM_KEY)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("Internal Server Error")
                done();
            });
    });

})