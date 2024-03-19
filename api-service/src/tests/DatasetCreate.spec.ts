import app from "../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { DATASET_REQUEST_WITH_DUPLICATE_DENORM_KEY, DATASET_REQUEST_WITH_NO_DENORM_CONFIG, VALIDATION_ERROR_DATASET_REQUEST, VALID_DATASET_REQUEST, VALID_MASTER_DATASET_REQUEST } from "./Fixtures";
import { describe, it } from 'mocha';
import { DatasetDraft } from "../models/DatasetDraft";
import { sequelize } from "../connections/databaseConnection";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("Dataset create API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Should insert a dataset record in the table", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(null)
        })
        chai.spy.on(DatasetDraft, "create", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v1/datasets/create")
            .send(VALID_DATASET_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("OK")
                done();
            });
    });

    it("Should insert a master dataset record in the table", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(null)
        })
        chai.spy.on(sequelize, "query", () => {
            return Promise.resolve([{ nextVal: 9 }])
        })
        chai.spy.on(DatasetDraft, "create", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v1/datasets/create")
            .send(VALID_MASTER_DATASET_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("OK")
                done();
            });
    });

    it("Failed request body schema validation", (done) => {
        chai
            .request(app)
            .post("/v1/datasets/create")
            .send(VALIDATION_ERROR_DATASET_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("Internal Server Error")
                done();
            });
    });

    it("Duplicate Denorm out field exists in the dataset", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(null)
        })
        chai
            .request(app)
            .post("/v1/datasets/create")
            .send(DATASET_REQUEST_WITH_DUPLICATE_DENORM_KEY)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("Internal Server Error")
                done();
            });
    });

    it("Duplicate Denorm out field exists in master dataset", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(null)
        })
        chai
            .request(app)
            .post("/v1/datasets/create")
            .send({ ...DATASET_REQUEST_WITH_DUPLICATE_DENORM_KEY, type: "master-dataset" })
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("Internal Server Error")
                done();
            });
    });

    it("Dataset Record Already exists", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({ datavalues: [] })
        })
        chai
            .request(app)
            .post("/v1/datasets/create")
            .send(DATASET_REQUEST_WITH_DUPLICATE_DENORM_KEY)
            .end((err, res) => {
                res.should.have.status(httpStatus.CONFLICT);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("Internal Server Error")
                done();
            });
    });

    it("Denorm config not provided by the user", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(null)
        })
        chai.spy.on(DatasetDraft, "create", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v1/datasets/create")
            .send(DATASET_REQUEST_WITH_NO_DENORM_CONFIG)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api");
                res.body.params.status.should.be.eq("OK")
                done();
            });
    });

})