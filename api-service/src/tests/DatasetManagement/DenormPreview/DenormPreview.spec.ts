import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from "mocha";
import { Dataset } from "../../../models/Dataset";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { apiId } from "../../../controllers/DenormPreview/DenormPreviewController";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("DENORM PREVIEW API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Success: No denorm config returns the base flattened event as-is", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                sample_data: { mergedEvent: { customer_id: "CUST001", customer: { email: "a@b.com" } } },
                denorm_config: { denorm_fields: [] }
            })
        })
        chai
            .request(app)
            .get("/v2/datasets/denorm-preview/telemetry?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.deep.eq({ customer_id: "CUST001", "customer.email": "a@b.com" })
                done();
            });
    });

    it("Success: Splices master dataset sample_data under denorm_out_field", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                sample_data: { mergedEvent: { customer_id: "CUST001" } },
                denorm_config: { denorm_fields: [{ denorm_key: "customer_id", denorm_out_field: "customer_details", dataset_id: "customers" }] }
            })
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([
                { dataset_id: "customers", sample_data: { mergedEvent: { email: "a@b.com", phone: "+911234567890" } } }
            ])
        })
        chai
            .request(app)
            .get("/v2/datasets/denorm-preview/telemetry?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.result.should.be.deep.eq({
                    customer_id: "CUST001",
                    "customer_details.email": "a@b.com",
                    "customer_details.phone": "+911234567890"
                })
                done();
            });
    });

    it("Success: Skips a master dataset that has no sample_data, without failing", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({
                sample_data: { mergedEvent: { customer_id: "CUST001" } },
                denorm_config: { denorm_fields: [{ denorm_key: "customer_id", denorm_out_field: "customer_details", dataset_id: "customers" }] }
            })
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ dataset_id: "customers", sample_data: {} }])
        })
        chai
            .request(app)
            .get("/v2/datasets/denorm-preview/telemetry")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.result.should.be.deep.eq({ customer_id: "CUST001" })
                done();
            });
    });

    it("Success: Same master dataset spliced under multiple denorm_out_fields", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                sample_data: { mergedEvent: { customer_id: "CUST001", vendor_id: "CUST001" } },
                denorm_config: {
                    denorm_fields: [
                        { denorm_key: "customer_id", denorm_out_field: "customer_details", dataset_id: "customers" },
                        { denorm_key: "vendor_id", denorm_out_field: "vendor_details", dataset_id: "customers" }
                    ]
                }
            })
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ dataset_id: "customers", sample_data: { mergedEvent: { email: "a@b.com" } } }])
        })
        chai
            .request(app)
            .get("/v2/datasets/denorm-preview/telemetry?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.result.should.be.deep.eq({
                    customer_id: "CUST001",
                    vendor_id: "CUST001",
                    "customer_details.email": "a@b.com",
                    "vendor_details.email": "a@b.com"
                })
                done();
            });
    });

})
