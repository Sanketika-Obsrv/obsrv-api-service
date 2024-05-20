import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import { datasetCopyFixtures } from "./Fixtures";
import chaiSpies from 'chai-spies'
import { describe, it } from 'mocha';
import { Datasource } from "../../../models/Datasource";
import { Dataset } from "../../../models/Dataset";
import { DatasetSourceConfig } from "../../../models/DatasetSourceConfig";
import { DatasetTransformations } from "../../../models/Transformation";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { DatasourceDraft } from "../../../models/DatasourceDraft";
import { DatasetTransformationsDraft } from "../../../models/TransformationDraft";
import { DatasetSourceConfigDraft } from "../../../models/DatasetSourceConfigDraft";
chai.use(chaiSpies)
chai.should();
chai.use(chaiHttp);
const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6d"

describe("DATASET COPY API TESTS", () => {

    afterEach(() => {
        chai.spy.restore()
    })

    it("Dataset copy success : should create draft version of particular dataset from taking data from live tables", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve(datasetCopyFixtures.READ_DATASET_RESPONSE)
        })

        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(datasetCopyFixtures.READ_DATASOURCE_RESPONSE)
        })

        chai.spy.on(DatasetSourceConfig, "findAll", () => {
            return Promise.resolve(datasetCopyFixtures.READ_DATASET_SOURCE_CONFIG_RESPONSE)
        })

        chai.spy.on(DatasetTransformations, "findAll", () => {
            return Promise.resolve(datasetCopyFixtures.READ_DATASET_TRANSFORMATIONS_RESPONSE)
        })

        chai.spy.on(DatasetDraft, "create", () => {
            return Promise.resolve({ dataValues: { id: "sampletestcopy1" } })
        })

        chai.spy.on(DatasourceDraft, "create", () => {
            return Promise.resolve({ dataValues: { id: "sampletestcopy1" } })
        })

        chai.spy.on(DatasetTransformationsDraft, "create", () => {
            return Promise.resolve({ dataValues: { id: "sampletestcopy1" } })
        })

        chai.spy.on(DatasetSourceConfigDraft, "create", () => {
            return Promise.resolve({ dataValues: { id: "sampletestcopy1" } })
        })

        chai
            .request(app)
            .post("/v1/dataset/copy")
            .send(datasetCopyFixtures.VALID_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.params.status.should.be.eq("SUCCESS");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.responseCode.should.be.eq("OK");
                res.body.result.message.should.be.eq("Dataset clone successful");
                res.body.result.should.have.property("dataset_id")
                done();
            });
    });

    it("Dataset copy success : should create draft version of particular dataset by taking data from draft tables", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(datasetCopyFixtures.READ_DATASET_RESPONSE)
        })

        chai.spy.on(DatasourceDraft, "findAll", () => {
            return Promise.resolve(datasetCopyFixtures.READ_DATASOURCE_RESPONSE)
        })

        chai.spy.on(DatasetSourceConfigDraft, "findAll", () => {
            return Promise.resolve(datasetCopyFixtures.READ_DATASET_SOURCE_CONFIG_RESPONSE)
        })

        chai.spy.on(DatasetTransformationsDraft, "findAll", () => {
            return Promise.resolve(datasetCopyFixtures.READ_DATASET_TRANSFORMATIONS_RESPONSE)
        })

        chai.spy.on(DatasetDraft, "create", () => {
            return Promise.resolve({ dataValues: { id: "sampletestcopy1" } })
        })

        chai.spy.on(DatasourceDraft, "create", () => {
            return Promise.resolve({ dataValues: { id: "sampletestcopy1" } })
        })

        chai.spy.on(DatasetTransformationsDraft, "create", () => {
            return Promise.resolve({ dataValues: { id: "sampletestcopy1" } })
        })

        chai.spy.on(DatasetSourceConfigDraft, "create", () => {
            return Promise.resolve({ dataValues: { id: "sampletestcopy1" } })
        })

        chai
            .request(app)
            .post("/v1/dataset/copy")
            .send(datasetCopyFixtures.DRAFT_VALID_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.params.status.should.be.eq("SUCCESS");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.responseCode.should.be.eq("OK");
                res.body.result.message.should.be.eq("Dataset clone successful");
                res.body.result.should.have.property("dataset_id")
                done();
            });
    });

    it("Dataset copy failure : Failed while saving dataset records", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(datasetCopyFixtures.READ_DATASET_RESPONSE)
        })

        chai.spy.on(DatasourceDraft, "findAll", () => {
            return Promise.resolve(datasetCopyFixtures.READ_DATASOURCE_RESPONSE)
        })

        chai.spy.on(DatasetSourceConfigDraft, "findAll", () => {
            return Promise.resolve(datasetCopyFixtures.READ_DATASET_SOURCE_CONFIG_RESPONSE)
        })

        chai.spy.on(DatasetTransformationsDraft, "findAll", () => {
            return Promise.resolve(datasetCopyFixtures.READ_DATASET_TRANSFORMATIONS_RESPONSE)
        })

        chai.spy.on(DatasetDraft, "create", () => {
            return Promise.resolve({ dataValues: { id: "sampletestcopy1" } })
        })

        chai.spy.on(DatasourceDraft, "create", () => {
            return Promise.resolve({ dataValues: { id: "sampletestcopy1" } })
        })

        chai.spy.on(DatasetTransformationsDraft, "create", () => {
            return Promise.resolve({ dataValues: { id: "sampletestcopy1" } })
        })

        chai.spy.on(DatasetSourceConfigDraft, "create", () => {
            return Promise.reject({ dataValues: { id: "sampletestcopy1" } })
        })

        chai
            .request(app)
            .post("/v1/dataset/copy")
            .send(datasetCopyFixtures.DRAFT_VALID_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.params.status.should.be.eq("FAILED");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                res.body.error.code.should.be.eq("DATASET_COPY_FAILURE");
                res.body.error.message.should.be.eq("Failed to clone dataset");
                done();
            });
    });

    it("Dataset copy failure : Invalid request body", (done) => {
        chai
            .request(app)
            .post("/v1/dataset/copy")
            .send(datasetCopyFixtures.INVALID_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.params.status.should.be.eq("FAILED");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                res.body.error.code.should.be.eq("DATASET_COPY_INVALID_INPUT");
                res.body.error.message.should.be.eq("#properties/request/required should have required property 'isLive'");
                done();
            });
    });

    it("Dataset copy failure : Database connection failure", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.reject()
        })
        chai
            .request(app)
            .post("/v1/dataset/copy")
            .send(datasetCopyFixtures.VALID_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(500);
                res.body.params.status.should.be.eq("FAILED");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                res.body.responseCode.should.be.eq("INTERNAL_SERVER_ERROR");
                res.body.error.code.should.be.eq("INTERNAL_SERVER_ERROR");
                res.body.error.message.should.be.eq("Failed to clone dataset");
                done();
            });
    });
})