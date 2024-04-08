import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import _ from "lodash";
import { sequelize } from "../../../connections/databaseConnection";
import { apiId } from "../../../controllers/DatasetRead/DatasetRead";
import { TestInputsForDatasetRead } from "./Fixtures";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("DATASET READ API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset read success: When minimal fields requested", (done) => {
        chai.spy.on(sequelize, "query", () => {
            return Promise.resolve([[{ 'name': 'sb-telemetry' }], {}])
        })
        chai
            .request(app)
            .get("/v1/datasets/read/sb-telemetry?fields=name")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.name.should.be.eq('sb-telemetry')
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify({ 'name': 'sb-telemetry' }))
                done();
            });
    });

    it("Dataset read success: Fetch all dataset fields when fields param is empty", (done) => {
        chai.spy.on(sequelize, "query", () => {
            return Promise.resolve([[TestInputsForDatasetRead.DRAFT_SCHEMA], {}])
        })
        chai
            .request(app)
            .get("/v1/datasets/read/sb-telemetry?status=Draft")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.type.should.be.eq('dataset')
                res.body.result.status.should.be.eq('Draft')
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify(TestInputsForDatasetRead.DRAFT_SCHEMA))
                done();
            });
    });

    it("Dataset read success: Fetch live dataset when status param is empty", (done) => {
        chai.spy.on(sequelize, "query", () => {
            return Promise.resolve([[TestInputsForDatasetRead.LIVE_SCHEMA], {}])
        })
        chai
            .request(app)
            .get("/v1/datasets/read/sb-telemetry")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.status.should.be.eq('Live')
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify(TestInputsForDatasetRead.LIVE_SCHEMA))
                done();
            });
    });

    it("Dataset read failure: When the dataset of requested dataset_id not found", (done) => {
        chai.spy.on(sequelize, "query", () => {
            return Promise.resolve([[], {}])
        })
        chai
            .request(app)
            .get("/v1/datasets/read/sb-telemetry?fields=name")
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Dataset with the given dataset_id not found")
                done();
            });
    });

    it("Dataset read failure: When specified field of live dataset cannot be found", (done) => {
        chai
            .request(app)
            .get("/v1/datasets/read/sb-telemetry?fields=version")
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                expect(res.body.params.errmsg).to.match(/^The specified field(.+) in the dataset cannot be found.$/)
                done();
            });
    });

    it("Dataset read failure: When specified field of draft dataset cannot be found", (done) => {
        chai
            .request(app)
            .get("/v1/datasets/read/sb-telemetry?fields=data_version&status=Draft")
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                expect(res.body.params.errmsg).to.match(/^The specified field(.+) in the dataset cannot be found.$/)
                done();
            });
    });

    it("Dataset read failure: Connection to the database failed", (done) => {
        chai.spy.on(sequelize, "query", () => {
            return Promise.reject()
        })
        chai
            .request(app)
            .get("/v1/datasets/read/sb-telemetry")
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.errmsg.should.be.eq("Failed to read dataset")
                done();
            });
    });
})