import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import { DatasetDraft } from "../../../models/DatasetDraft";
import _ from "lodash";
import { TestInputsForDatasetUpdate } from "./Fixtures";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("DATASET DEDUPE CONFIG UPDATE", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Success: Dataset dedupe configs updated with dedup key if duplicates need to be dropped", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft"
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send(TestInputsForDatasetUpdate.DATASET_UPDATE_DEDUP_DUPLICATES_TRUE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.update");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                done();
            });
    });

    it("Success: Dataset dedupe configs updated with default values if duplicates need to be dropped", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                id: "telemetry", status: "Draft"
            })
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
        })
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send({ dataset_id: "telemetry", dedup_config: { drop_duplicates: false } })
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.update");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.id.should.be.eq("telemetry")
                res.body.result.message.should.be.eq("Dataset is updated successfully")
                done();
            });
    });


    it("Failure: Dedup key not provided when duplicates need to be dropped", (done) => {
        chai
            .request(app)
            .patch("/v1/datasets/update")
            .send({ dataset_id: "telemetry", dedup_config: { drop_duplicates: true } })
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.update");
                res.body.params.status.should.be.eq("FAILED")
                expect(res.body.params.errmsg).to.match(/^#properties(.+)'.dedup_key'$/)
                done();
            });
    });
})