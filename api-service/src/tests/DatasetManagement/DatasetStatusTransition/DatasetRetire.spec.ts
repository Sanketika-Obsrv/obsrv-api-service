import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from "mocha";
import _ from "lodash";
import { TestInputsForDatasetStatusTransition } from "./Fixtures";
import { Dataset } from "../../../models/Dataset";
import { DatasetDraft } from "../../../models/DatasetDraft";
import { DatasetTransformations } from "../../../models/Transformation";
import { DatasetSourceConfig } from "../../../models/DatasetSourceConfig";
import { Datasource } from "../../../models/Datasource";
import { commandHttpService } from "../../../connections/commandServiceConnection";
import { druidHttpService } from "../../../connections/druidConnection";
import { sequelize } from "../../../connections/databaseConnection";
import { datasetService } from "../../../services/DatasetService";
import { userService } from "../../../services/UserService";
import { config } from "../../../configs/Config";
import { buildRbacToken, NO_ACCESS_ROLE } from "../../helpers/rbacTestHelper";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6"

describe("DATASET STATUS TRANSITION RETIRE", () => {

    afterEach(() => {
        chai.spy.restore();
        config.is_RBAC_enabled = "false";
    });

    it("Dataset status transition success: When the action is to Retire dataset", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve(TestInputsForDatasetStatusTransition.SCHEMA_TO_RETIRE)
        })
        chai.spy.on(DatasetTransformations, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetSourceConfig, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Dataset, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve([{ datasource_ref: "telemetry" }])
        })
        chai.spy.on(datasetService, "deleteAlerts", () => {
            return Promise.resolve({})
        })
        chai.spy.on(druidHttpService, "post", () => {
            return Promise.resolve({})
        })
        chai.spy.on(commandHttpService, "post", () => {
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
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to Retire successful")
                res.body.result.dataset_id.should.be.eq("telemetry")
                done();
            });
    });

    it("Dataset status transition success: When the action is to Retire master dataset", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "Live", type: "master-dataset" })
        })
        chai.spy.on(DatasetTransformations, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetSourceConfig, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Dataset, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(datasetService, "deleteAlerts", () => {
            return Promise.resolve({})
        })
        chai.spy.on(commandHttpService, "post", () => {
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
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to Retire successful")
                res.body.result.dataset_id.should.be.eq("telemetry")
                done();
            });
    });

    it("Dataset status transition successs: Dataset successfully retired on delete supervisors failure", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ dataset_id: "telemetry", status: "Live", type: "dataset" })
        })
        chai.spy.on(DatasetTransformations, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(DatasetSourceConfig, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(datasetService, "deleteAlerts", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Dataset, "update", () => {
            return Promise.resolve({})
        })
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(["telemetry"])
        })
        chai.spy.on(druidHttpService, "post", () => {
            return Promise.reject({})
        })
        chai.spy.on(commandHttpService, "post", () => {
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
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.message.should.be.eq("Dataset status transition to Retire successful")
                res.body.result.dataset_id.should.be.eq("telemetry")
                done();
            });
    });

    it("Dataset status transition failure: When dataset is not found to retire", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve()
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
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

    it("Dataset status transition failure: When dataset is already retired", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ ...TestInputsForDatasetStatusTransition.SCHEMA_TO_RETIRE, status: "Retired" })
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.CONFLICT);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Transition failed for dataset: dataset-all-fields7 status:Retired with status transition to Retire")
                res.body.error.code.should.be.eq("DATASET_RETIRE_FAILURE")
                done();
            })
    })

    it("Dataset status transition failure: When dataset to retire is used by other datasets", (done) => {
        chai.spy.on(Dataset, "findOne", () => {
            return Promise.resolve({ ...TestInputsForDatasetStatusTransition.SCHEMA_TO_RETIRE, type: "master" })
        })
        chai.spy.on(Dataset, "findAll", () => {
            return Promise.resolve([{ dataset_id: "telemetry", denorm_config: { denorm_fields: [{ dataset_id: "dataset-all-fields7" }] } }])
        })
        chai.spy.on(DatasetDraft, "findAll", () => {
            return Promise.resolve([{ dataset_id: "telemetry", denorm_config: { denorm_fields: [{ dataset_id: "dataset-all-fields7" }] } }])
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq("api.datasets.status-transition");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Failed to retire dataset as it is in use. Please retire or delete dependent datasets before retiring this dataset")
                res.body.error.code.should.be.eq("DATASET_IN_USE")
                done();
            });
    });

    it("Dataset status transition retire failure: RBAC enabled and user lacks a valid role", (done) => {
        config.is_RBAC_enabled = "true";
        chai.spy.on(userService, "getUser", () => {
            return Promise.resolve({ roles: [NO_ACCESS_ROLE] })
        })
        chai
            .request(app)
            .post("/v2/datasets/status-transition")
            .set("Authorization", `Bearer ${buildRbacToken()}`)
            .send(TestInputsForDatasetStatusTransition.VALID_SCHEMA_FOR_RETIRE)
            .end((err, res) => {
                res.should.have.status(httpStatus.FORBIDDEN);
                done();
            });
    });

})