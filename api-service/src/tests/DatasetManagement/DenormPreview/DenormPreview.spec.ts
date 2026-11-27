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
                res.body.result.should.be.deep.eq({ event: { customer_id: "CUST001", "customer.email": "a@b.com" }, unavailable_denorm_fields: [] })
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
                res.body.result.event.should.be.deep.eq({
                    customer_id: "CUST001",
                    "customer_details.email": "a@b.com",
                    "customer_details.phone": "+911234567890"
                })
                res.body.result.unavailable_denorm_fields.should.be.deep.eq([])
                done();
            });
    });

    it("Success: Reports a master dataset with no sample_data as unavailable, without failing", (done) => {
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
                res.body.result.should.be.deep.eq({ event: { customer_id: "CUST001" }, unavailable_denorm_fields: ["customer_details"] })
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
                res.body.result.event.should.be.deep.eq({
                    customer_id: "CUST001",
                    vendor_id: "CUST001",
                    "customer_details.email": "a@b.com",
                    "vendor_details.email": "a@b.com"
                })
                res.body.result.unavailable_denorm_fields.should.be.deep.eq([])
                done();
            });
    });

    it("Success: Reports a master dataset that is not live (draft-only) as unavailable", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                sample_data: { mergedEvent: { customer_id: "CUST001", school_id: "SCH001" } },
                denorm_config: {
                    denorm_fields: [
                        { denorm_key: "customer_id", denorm_out_field: "customer_details", dataset_id: "customers" },
                        { denorm_key: "school_id", denorm_out_field: "school", dataset_id: "schools-draft-only" }
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
                res.body.result.event.should.be.deep.eq({
                    customer_id: "CUST001",
                    school_id: "SCH001",
                    "customer_details.email": "a@b.com"
                })
                res.body.result.unavailable_denorm_fields.should.be.deep.eq(["school"])
                done();
            });
    });

    it("Success: Ignores a denorm field with no denorm_out_field", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                sample_data: { mergedEvent: { customer_id: "CUST001" } },
                denorm_config: { denorm_fields: [{ denorm_key: "customer_id", dataset_id: "customers" }] }
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
                res.body.result.should.be.deep.eq({ event: { customer_id: "CUST001" }, unavailable_denorm_fields: [] })
                done();
            });
    });

    it("Success: Looks up only live master datasets, so a retired master is reported as unavailable", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                sample_data: { mergedEvent: { customer_id: "CUST001" } },
                denorm_config: { denorm_fields: [{ denorm_key: "customer_id", denorm_out_field: "customer_details", dataset_id: "customers" }] }
            })
        })
        let where: any;
        chai.spy.on(Dataset, "findAll", (options: any) => {
            where = options.where;
            return Promise.resolve([])
        })
        chai
            .request(app)
            .get("/v2/datasets/denorm-preview/telemetry?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                where.status.should.be.eq("Live");
                where.type.should.be.eq("master");
                res.body.result.unavailable_denorm_fields.should.be.deep.eq(["customer_details"])
                done();
            });
    });

    it("Success: Reports a master whose sample_data is a $schema placeholder as unavailable", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({
                sample_data: { mergedEvent: { customer_id: "CUST001" } },
                denorm_config: { denorm_fields: [{ denorm_key: "customer_id", denorm_out_field: "customer_details", dataset_id: "customers" }] }
            })
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ dataset_id: "customers", sample_data: { mergedEvent: { $schema: "https://json-schema.org/draft/2020-12/schema", properties: { email: { type: "string" } } } } }])
        })
        chai
            .request(app)
            .get("/v2/datasets/denorm-preview/telemetry?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.result.should.be.deep.eq({ event: { customer_id: "CUST001" }, unavailable_denorm_fields: ["customer_details"] })
                done();
            });
    });

    it("Failure: Returns 400 for an unknown mode", (done) => {
        chai
            .request(app)
            .get("/v2/datasets/denorm-preview/telemetry?mode=foo")
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.error.code.should.be.eq("DENORM_PREVIEW_INVALID_MODE")
                done();
            });
    });

    it("Failure: Returns 404 when the dataset does not exist", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(null)
        })
        chai
            .request(app)
            .get("/v2/datasets/denorm-preview/does-not-exist?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.error.message.should.be.eq("Dataset with the given dataset_id:does-not-exist not found")
                res.body.error.code.should.be.eq("DATASET_NOT_FOUND")
                done();
            });
    });

    it("Failure: Returns 400 when mode is repeated in the query string (becomes an array)", (done) => {
        chai
            .request(app)
            .get("/v2/datasets/denorm-preview/telemetry?mode=edit&mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.error.code.should.be.eq("DENORM_PREVIEW_INVALID_MODE")
                done();
            });
    });

})
