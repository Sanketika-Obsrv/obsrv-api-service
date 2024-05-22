import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import _ from "lodash";
import { apiId } from "../../../controllers/DatasetRead/DatasetRead";
import { TestInputsForDatasetRead } from "./Fixtures";
import { DatasetTransformations } from "../../../models/Transformation";
import { DatasetTransformationsDraft } from "../../../models/TransformationDraft";
import { Dataset } from "../../../models/Dataset";
import { DatasetDraft } from "../../../models/DatasetDraft";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("DATASET READ API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset read success: When minimal fields requested", (done) => {
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ 'name': 'sb-telemetry', 'data_version': 1 }])
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry?fields=name,version")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.name.should.be.eq('sb-telemetry')
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify({ 'name': 'sb-telemetry', 'version': 1 }))
                done();
            });
    });

    it("Dataset read success: Fetch all dataset fields when fields param is empty", (done) => {
        chai.spy.on(DatasetDraft, "findAll", () => {
            return Promise.resolve([TestInputsForDatasetRead.DRAFT_SCHEMA])
        })
        chai.spy.on(DatasetTransformationsDraft, "findAll", () => {
            return Promise.resolve([])
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry?status=Draft")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.type.should.be.eq('dataset')
                res.body.result.status.should.be.eq('Draft')
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify({ ...TestInputsForDatasetRead.DRAFT_SCHEMA, "transformations_config": [] }))
                done();
            });
    });

    it("Dataset read success: Fetch live dataset when status param is empty", (done) => {
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([TestInputsForDatasetRead.LIVE_SCHEMA])
        })
        chai.spy.on(DatasetTransformations, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.TRANSFORMATIONS_SCHEMA)
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.status.should.be.eq('Live')
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify({ ..._.omit({ ...TestInputsForDatasetRead.LIVE_SCHEMA, "transformations_config": TestInputsForDatasetRead.TRANSFORMATIONS_SCHEMA }, ["data_version"]), version: 1 }))
                done();
            });
    });

    it("Dataset read failure: When the dataset of requested dataset_id not found", (done) => {
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([])
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry?fields=name")
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("Dataset with the given dataset_id not found")
                res.body.error.code.should.be.eq("DATASET_NOT_FOUND")
                done();
            });
    });

    it("Dataset read failure: When specified field of live dataset cannot be found", (done) => {
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry?fields=data")
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                expect(res.body.error.message).to.match(/^The specified field(.+) in the dataset cannot be found.$/)
                res.body.error.code.should.be.eq("DATASET_INVALID_FIELDS")
                done();
            });
    });

    it("Dataset read failure: When specified field of draft dataset cannot be found", (done) => {
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry?fields=data&status=Draft")
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                expect(res.body.error.message).to.match(/^The specified field(.+) in the dataset cannot be found.$/)
                res.body.error.code.should.be.eq("DATASET_INVALID_FIELDS")
                done();
            });
    });

    it("Dataset read failure: Connection to the database failed", (done) => {
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.reject()
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry")
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("Failed to read dataset")
                res.body.error.code.should.be.eq("DATASET_READ_FAILURE")
                done();
            });
    });
})