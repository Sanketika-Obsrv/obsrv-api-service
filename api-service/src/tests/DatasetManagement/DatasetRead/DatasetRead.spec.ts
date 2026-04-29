import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from "mocha";
import _ from "lodash";
import { apiId, defaultFields } from "../../../controllers/DatasetRead/DatasetRead";
import { TestInputsForDatasetRead } from "./Fixtures";
import { DatasetTransformations } from "../../../models/Transformation";
import { Dataset } from "../../../models/Dataset";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { DatasetSourceConfig } from "../../../models/DatasetSourceConfig";
import { ConnectorInstances } from "../../../models/ConnectorInstances";
import { DatasetTransformationsDraft } from "../../../models/TransformationDraft";
import { DatasetSourceConfigDraft } from "../../../models/DatasetSourceConfigDraft";
import { sequelize } from "../../../connections/databaseConnection";
import { DatasourceDraft } from "../../../models/DatasourceDraft";
import { Datasource } from "../../../models/Datasource";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("DATASET READ API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset read success: When minimal fields requested", (done) => {
        chai.spy.on(Datasource, "findOne", () => { return Promise.resolve({ datasource: "sb-telemetry" }); })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ "name": "sb-telemetry", "version": 1 })
        })
        chai.spy.on(DatasetTransformations, "findAll", () => {
            return Promise.resolve([])
        })
        chai.spy.on(ConnectorInstances, "findAll", () => {
            return Promise.resolve([])
        })
        chai.spy.on(DatasetSourceConfig, "findAll", () => {
            return Promise.resolve([])
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
                res.body.result.name.should.be.eq("sb-telemetry")
                const result = res.body.result;
                expect(result.name).to.eq("sb-telemetry");
                expect(result.version).to.eq(1);
                done();
            });
    });

    it("Dataset read success: Fetch all dataset fields when fields param is empty", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetRead.DRAFT_SCHEMA)
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.type.should.be.eq("event")
                res.body.result.status.should.be.eq("Draft")
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify({ ...TestInputsForDatasetRead.DRAFT_SCHEMA }))
                done();
            });
    });

    it("Dataset read success: Fetch live dataset when mode param not provided", (done) => {
        chai.spy.on(DatasetTransformations, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.TRANSFORMATIONS_SCHEMA)
        })
        chai.spy.on(ConnectorInstances, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.CONNECTORS_SCHEMA_V2)
        })
        chai.spy.on(DatasetSourceConfig, "findAll", () => {
            return Promise.resolve([])
        })
        chai.spy.on(Datasource, "findOne", () => { return Promise.resolve({ datasource: "sb-telemetry" }); })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetRead.LIVE_SCHEMA)
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry")
            .end((err, res) => {
                if (res.status !== httpStatus.OK) { console.log("RESBODY:", res.body); }
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.status.should.be.eq("Live")
                const result = _.omit(res.body.result, ["alias"]);
                const expectedConnectors = TestInputsForDatasetRead.CONNECTORS_SCHEMA_V2.map(c => ({...c, version: "v2"}));
                const expected = { ...TestInputsForDatasetRead.LIVE_SCHEMA, connectors_config: expectedConnectors, transformations_config: TestInputsForDatasetRead.TRANSFORMATIONS_SCHEMA };
                JSON.stringify(result).should.be.eq(JSON.stringify(expected))
                done();
            });
    });

    it("Dataset read success: Creating draft on mode=edit if no draft found in v2", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve()
        })
        chai.spy.on(Datasource, "findOne", () => { return Promise.resolve({ datasource: "sb-telemetry" }); })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetRead.LIVE_SCHEMA)
        })
        chai.spy.on(DatasetTransformations, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.TRANSFORMATIONS_SCHEMA)
        })
        chai.spy.on(DatasetSourceConfig, "findAll", () => {
            return Promise.resolve([])
        })
        chai.spy.on(ConnectorInstances, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.CONNECTORS_SCHEMA_V2)
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.MASTER_DATASET_SCHEMA)
        })
        chai.spy.on(DatasetDraft, "create", () => {
            return Promise.resolve({ dataValues: TestInputsForDatasetRead.DRAFT_SCHEMA })
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.name.should.be.eq("sb-telemetry")
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify(TestInputsForDatasetRead.DRAFT_SCHEMA))
                done();
            });
    });

    it("Dataset read success: Creating draft on mode=edit if no draft found in v1", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve()
        })
        chai.spy.on(Datasource, "findOne", () => { return Promise.resolve({ datasource: "sb-telemetry" }); })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ ...TestInputsForDatasetRead.LIVE_SCHEMA, "api_version": "v1" })
        })
        chai.spy.on(DatasetTransformations, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.TRANSFORMATIONS_SCHEMA_V1)
        })
        chai.spy.on(DatasetSourceConfig, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.CONNECTORS_SCHEMA_V1)
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.MASTER_DATASET_SCHEMA)
        })
        chai.spy.on(DatasetDraft, "create", () => {
            return Promise.resolve({ dataValues: TestInputsForDatasetRead.DRAFT_SCHEMA })
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.name.should.be.eq("sb-telemetry")
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify(TestInputsForDatasetRead.DRAFT_SCHEMA))
                done();
            });
    });

    it("Dataset read success: Migrating v1 draft dataset to v2 on mode=edit", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetRead.DRAFT_SCHEMA_V1)
        })
        chai.spy.on(DatasetTransformationsDraft, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.TRANSFORMATIONS_SCHEMA_V1)
        })
        chai.spy.on(DatasetSourceConfigDraft, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.CONNECTORS_SCHEMA_V1)
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({ dataValues: TestInputsForDatasetRead.DRAFT_SCHEMA })
        })
        chai.spy.on(DatasetTransformationsDraft, "destroy", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetSourceConfigDraft, "destroy", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasourceDraft, "destroy", () => {
            return Promise.resolve({})
        })
        const t = chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve(sequelize.transaction)
        })
        chai.spy.on(t, "commit", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.name.should.be.eq("sb-telemetry")
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify(_.pick(TestInputsForDatasetRead.DRAFT_SCHEMA_V1, defaultFields)))
                done();
            });
    });

    it("Dataset read failure: Updating dataset status to draft on mode=edit fails as live record not found", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve()
        })
        chai.spy.on(Datasource, "findOne", () => { return Promise.resolve({ datasource: "sb-telemetry" }); })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve()
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("Dataset with the given dataset_id:sb-telemetry not found")
                res.body.error.code.should.be.eq("DATASET_NOT_FOUND")
                done();
            });
    });

    it("Dataset read failure: When dependent denorm master dataset not found", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve()
        })
        chai.spy.on(Datasource, "findOne", () => { return Promise.resolve({ datasource: "sb-telemetry" }); })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ ...TestInputsForDatasetRead.LIVE_SCHEMA, "api_version": "v1" })
        })
        chai.spy.on(DatasetTransformations, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.TRANSFORMATIONS_SCHEMA_V1)
        })
        chai.spy.on(DatasetSourceConfig, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.CONNECTORS_SCHEMA_V1)
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([])
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("The dependent dataset not found")
                res.body.error.code.should.be.eq("DEPENDENT_MASTER_DATA_NOT_FOUND")
                done();
            });
    });

    it("Dataset read failure: When dependent denorm master dataset not live", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve()
        })
        chai.spy.on(Datasource, "findOne", () => { return Promise.resolve({ datasource: "sb-telemetry" }); })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ ...TestInputsForDatasetRead.LIVE_SCHEMA, "api_version": "v1" })
        })
        chai.spy.on(DatasetTransformations, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.TRANSFORMATIONS_SCHEMA_V1)
        })
        chai.spy.on(DatasetSourceConfig, "findAll", () => {
            return Promise.resolve(TestInputsForDatasetRead.CONNECTORS_SCHEMA_V1)
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ "dataset_id": "master_dataset", "dataset_config": { "cache_config": { "redis_db": 20 } } }])
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.PRECONDITION_REQUIRED);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("The dependent master dataset is not published")
                res.body.error.code.should.be.eq("DEPENDENT_MASTER_DATA_NOT_LIVE")
                done();
            });
    });

    it("Dataset read failure: When the dataset of requested dataset_id not found", (done) => {
        chai.spy.on(Datasource, "findOne", () => { return Promise.resolve({ datasource: "sb-telemetry" }); })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve(null)
        })
        chai
            .request(app)
            .get("/v2/datasets/read/sb-telemetry?fields=name")
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("Dataset with the given dataset_id:sb-telemetry not found")
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
            .get("/v2/datasets/read/sb-telemetry?fields=data&mode=edit")
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

})