// import app from "../../../app";
// import chai, { expect } from "chai";
// import chaiHttp from "chai-http";
// import spies from "chai-spies";
// import httpStatus from "http-status";
// import { describe, it } from 'mocha';
// import { DatasetDraft } from "../../../models/DatasetDraft";
// import _ from "lodash";
// import { TestInputsForDatasetUpdate } from "./Fixtures";
// import { apiId } from "../../../controllers/DatasetUpdate/DatasetUpdate"

// chai.use(spies);
// chai.should();
// chai.use(chaiHttp);

// describe("DATASET EXTRACTION CONFIG UPDATE", () => {

//     afterEach(() => {
//         chai.spy.restore();
//     });

//     it("Success: Dataset extraction configs updated if it is a batch event", (done) => {
//         chai.spy.on(DatasetDraft, "findOne", () => {
//             return Promise.resolve({
//                 id: "telemetry", status: "Draft"
//             })
//         })
//         chai.spy.on(DatasetDraft, "update", () => {
//             return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
//         })
//         chai
//             .request(app)
//             .patch("/v1/datasets/update")
//             .send(TestInputsForDatasetUpdate.DATASET_UPDATE_EXTRACTION_DROP_DUPLICATES)
//             .end((err, res) => {
//                 res.should.have.status(httpStatus.OK);
//                 res.body.should.be.a("object")
//                 res.body.id.should.be.eq(apiId);
//                 res.body.params.status.should.be.eq("SUCCESS")
//                 res.body.result.id.should.be.eq("telemetry")
//                 res.body.result.message.should.be.eq("Dataset is updated successfully")
//                 done();
//             });
//     });

//     it("Success: Dataset extraction configs updated with default values if it is not batch event", (done) => {
//         chai.spy.on(DatasetDraft, "findOne", () => {
//             return Promise.resolve({
//                 id: "telemetry", status: "Draft"
//             })
//         })
//         chai.spy.on(DatasetDraft, "update", () => {
//             return Promise.resolve({ dataValues: { id: "telemetry", message: "Dataset is updated successfully" } })
//         })
//         chai
//             .request(app)
//             .patch("/v1/datasets/update")
//             .send({ dataset_id: "telemetry", extraction_config: { "is_batch_event": false } })
//             .end((err, res) => {
//                 res.should.have.status(httpStatus.OK);
//                 res.body.should.be.a("object")
//                 res.body.id.should.be.eq(apiId);
//                 res.body.params.status.should.be.eq("SUCCESS")
//                 res.body.result.id.should.be.eq("telemetry")
//                 res.body.result.message.should.be.eq("Dataset is updated successfully")
//                 done();
//             });
//     });


//     it("Failure: Extraction configs not provided as batch event is true", (done) => {
//         chai
//             .request(app)
//             .patch("/v1/datasets/update")
//             .send({ dataset_id: "telemetry", extraction_config: { "is_batch_event": true } })
//             .end((err, res) => {
//                 res.should.have.status(httpStatus.BAD_REQUEST);
//                 res.body.should.be.a("object")
//                 res.body.id.should.be.eq(apiId);
//                 res.body.params.status.should.be.eq("FAILED")
//                 expect(res.body.params.errmsg).to.match(/^#properties(.+)'.extraction_key'$/)
//                 done();
//             });
//     });
// })