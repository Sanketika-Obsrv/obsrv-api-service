import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from "mocha";
import _ from "lodash";
import { TestInputsForDatasetStatusTransition } from "./Fixtures";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { commandHttpService } from "../../../connections/commandServiceConnection";
import { sequelize } from "../../../connections/databaseConnection";
import { DatasourceDraft } from "../../../models/DatasourceDraft";
import { Dataset } from "../../../models/Dataset";
import { Datasource } from "../../../models/Datasource";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6"

describe("DATASET STATUS TRANSITION LIVE", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset status transition success: When the action is to set dataset live", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetStatusTransition.DRAFT_DATASET_SCHEMA_FOR_PUBLISH)
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ "id": "master-dataset", "status": "Live", "dataset_config": { "cache_config": { "redis_db": 21 } }, "api_version": "v2" }])
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ "data_schema": { "email": { "data_type": "string", "arrival_format": "string" } } })
        })
        chai.spy.on(DatasourceDraft, "upsert", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve([])
        })
        chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve({ commit: () => Promise.resolve(), rollback: () => Promise.resolve() })
        })
        chai.spy.on(commandHttpService, "post", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                if (res.status !== httpStatus.OK) { console.log("RESBODY:", res.body); }
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to Live successful")
                res.body.result.dataset_id.should.be.eq("telemetry")
                done();
            });
    });

    it("Dataset status transition success: When the action is to set dataset live v1 by creating hudi spec", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetStatusTransition.DRAFT_DATASET_SCHEMA_FOR_PUBLISH_HUDI)
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ "id": "master-dataset", "status": "Live", "dataset_config": { "cache_config": { "redis_db": 21 } }, "api_version": "v2" }])
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ "data_schema": { "email": { "data_type": "string", "arrival_format": "string" } } })
        })
        chai.spy.on(DatasourceDraft, "upsert", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve([])
        })
        chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve({ commit: () => Promise.resolve(), rollback: () => Promise.resolve() })
        })
        chai.spy.on(commandHttpService, "post", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to Live successful")
                res.body.result.dataset_id.should.be.eq("telemetry")
                done();
            });
    });

    it("Dataset status transition success: When the action is to set dataset live v2 by updating hudi spec", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetStatusTransition.DRAFT_DATASET_SCHEMA_FOR_PUBLISH_HUDI)
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ "id": "master-dataset", "status": "Live", "dataset_config": { "cache_config": { "redis_db": 21 } }, "api_version": "v2" }])
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ "api_version":"v2", "data_schema": { "email": { "data_type": "string", "arrival_format": "string" } } })
        })
        chai.spy.on(DatasourceDraft, "upsert", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "findOne", () => {
            return Promise.resolve({"ingestion_spec":{"dataset": "dataset-all-fields4", "schema": {"table": "dataset-all-fields4_events", "partitionColumn": "eid", "timestampColumn": "obsrv_meta.syncts", "primaryKey": "eid", "columnSpec": [{"type": "string", "name": "mid", "index": 1}, {"type": "epoch", "name": "ets", "index": 2}, {"type": "string", "name": "userdata.mid", "index": 3}, {"type": "epoch", "name": "userdata.ets", "index": 4}, {"type": "string", "name": "userdata.eid", "index": 5}, {"type": "string", "name": "email", "index": 6}, {"type": "string", "name": "obsrv.meta.source.connector", "index": 7}, {"type": "string", "name": "obsrv.meta.source.id", "index": 8}]}, "inputFormat": {"type": "json", "flattenSpec": {"fields": [{"type": "path", "expr": "$.mid", "name": "mid"}, {"type": "path", "expr": "$.ets", "name": "ets"}, {"type": "path", "expr": "$.eid", "name": "eid"}, {"type": "path", "expr": "$.userdata.mid", "name": "userdata.mid"}, {"type": "path", "expr": "$.userdata.ets", "name": "userdata.ets"}, {"type": "path", "expr": "$.userdata.eid", "name": "userdata.eid"}, {"type": "path", "expr": "$.email", "name": "email"}, {"type": "path", "expr": "$.obsrv_meta.syncts", "name": "obsrv_meta.syncts"}, {"type": "path", "expr": "$.obsrv_meta.source.connector", "name": "obsrv.meta.source.connector"}, {"type": "path", "expr": "$.obsrv_meta.source.connectorInstance", "name": "obsrv.meta.source.id"}]}}}})
        })
        chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve({ commit: () => Promise.resolve(), rollback: () => Promise.resolve() })
        })
        chai.spy.on(commandHttpService, "post", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to Live successful")
                res.body.result.dataset_id.should.be.eq("telemetry")
                done();
            });
    });

    it("Dataset status transition failure: Unable to fetch redis db number for master dataset", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetStatusTransition.DRAFT_MASTER_DATASET_INVALID)
        })
        chai.spy.on(sequelize, "query", () => {
            return Promise.resolve([])
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE_MASTER)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Unable to fetch the redis db index for the master data")
                res.body.error.code.should.be.eq("REDIS_DB_INDEX_FETCH_FAILED")
                done();
            });
    });

    it("Dataset status transition success: When the action is to set master dataset live", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetStatusTransition.DRAFT_MASTER_DATASET_SCHEMA_FOR_PUBLISH)
        })
        chai.spy.on(sequelize, "query", () => {
            return Promise.resolve([[{ nextval: 9 }]])
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve({ commit: () => Promise.resolve(), rollback: () => Promise.resolve() })
        })
        chai.spy.on(commandHttpService, "post", () => {
            return Promise.resolve({})
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE_MASTER)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to Live successful")
                res.body.result.dataset_id.should.be.eq("master-telemetry")
                done();
            });
    });

    it("Dataset status transition failure: When the dependent denorm master dataset is not live", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(_.clone(TestInputsForDatasetStatusTransition.DRAFT_DATASET_SCHEMA_FOR_PUBLISH))
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ "id": "master-dataset", "status": "Retired", "dataset_config": { "redis_db": 21 }, "api_version": "v1" }])
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.PRECONDITION_REQUIRED);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("The datasets with id:master-dataset are not in published status")
                res.body.error.code.should.be.eq("DEPENDENT_MASTER_DATA_NOT_LIVE")
                done();
            });
    });

    it("Dataset status transition failure: When dataset to publish is self referencing the denorm master dataset", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({...TestInputsForDatasetStatusTransition.DRAFT_DATASET_SCHEMA_FOR_PUBLISH, "id": "master-dataset"})
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.CONFLICT);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("The denorm master dataset is self-referencing itself")
                res.body.error.code.should.be.eq("SELF_REFERENCING_MASTER_DATA")
                done();
            });
    });

    it("Dataset status transition failure: When dataset is not found to publish", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve()
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Dataset not found for dataset: telemetry")
                res.body.error.code.should.be.eq("DATASET_NOT_FOUND")
                done();
            })
    })

    it("Dataset status transition failure: When the command api call to publish dataset fails", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetStatusTransition.DRAFT_DATASET_SCHEMA_FOR_PUBLISH)
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ "id": "master-dataset", "status": "Live", "dataset_config": { "cache_config": { "redis_db": 21 } }, "api_version": "v2" }])
        })
        chai.spy.on(DatasetDraft, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ "data_schema": { "email": { "data_type": "string", "arrival_format": "string" } } })
        })
        chai.spy.on(DatasourceDraft, "upsert", () => {
            return Promise.resolve({})
        })
        chai.spy.on(sequelize, "transaction", () => {
            return Promise.resolve({ commit: () => Promise.resolve(), rollback: () => Promise.resolve() })
        })
        chai.spy.on(commandHttpService, "post", () => {
            return Promise.reject()
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                done();
            });
    });

    it("Dataset status transition failure: When the dataset to publish is in draft state", (done) => {
        chai.spy.on(DatasetDraft, "findOne", () => {
            return Promise.resolve({...TestInputsForDatasetStatusTransition.DRAFT_DATASET_SCHEMA_FOR_PUBLISH, status: "Draft"})
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_LIVE)
            .end((err, res) => {
                res.should.have.status(httpStatus.CONFLICT);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq("DATASET_LIVE_FAILURE")
                res.body.error.message.should.be.eq("Transition failed for dataset: telemetry status:Draft with status transition to Live")
                done();
            });
    });

})