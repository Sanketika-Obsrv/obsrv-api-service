import app from "../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import constants from '../resources/Constants.json'
import { TestDataSource } from "./Fixtures";
import { config } from "./Config";
import { routesConfig } from "../configs/RoutesConfig";
import { dbConnector } from "../routes/Router";
import { describe, it } from 'mocha';
import { ResponseHandler } from "../helpers/ResponseHandler";
import { ingestorService } from "../routes/Router";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe('Datasource APIS', () => {
    afterEach(()=>{
        chai.spy.restore()
    })
    describe("Datasource create API", () => {
        it("should insert a record in the database", (done) => {
            chai.spy.on(ingestorService, "getDatasetConfig", () => {
                return { "id": ":telemetry", "dataset_config": { "entry_topic": "telemetry" }, "router_config": { "topic": "telemetry" } }
            })
            chai.spy.on(dbConnector, "execute", () => {
                return Promise.resolve([])
            })
            chai
                .request(app)
                .post(config.apiDatasourceSaveEndPoint)
                .send(TestDataSource.VALID_SCHEMA)
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "200_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.save.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.SUCCESS)
                    res.body.result.message.should.be.eq(constants.RECORD_SAVED)
                    chai.spy.restore(ingestorService, "getDatasetConfig")
                    chai.spy.restore(dbConnector, "execute");
                    done();
                });
        });
        it("should throw error when datasource ref is invalid", (done) => {
            chai.spy.on(ingestorService, "getDatasetConfig", () => {
                return { "id": ":telemetry", "dataset_config": { "entry_topic": "telemetry" }, "router_config": { "topic": "telemetry" } }
            })
            chai.spy.on(dbConnector, "execute", () => {
                return Promise.resolve([])
            })
            chai
                .request(app)
                .post(config.apiDatasourceSaveEndPoint)
                .send(TestDataSource.INVALID_DATASOURCE_REF)
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "400_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.save.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                    chai.spy.restore(ingestorService, "getDatasetConfig")
                    chai.spy.restore(dbConnector, "execute");
                    done();
                });
        });
        it("should throw error when topic is invalid", (done) => {
            chai.spy.on(ingestorService, "getDatasetConfig", () => {
                return { "id": ":telemetry", "dataset_config": { "entry_topic": "telemetry" }, "router_config": { "topic": "telemetry" } }
            })
            chai.spy.on(dbConnector, "execute", () => {
                return Promise.resolve([])
            })
            chai
                .request(app)
                .post(config.apiDatasourceSaveEndPoint)
                .send(TestDataSource.INVALID_INPUT_TOPIC)
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "400_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.save.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                    chai.spy.restore(ingestorService, "getDatasetConfig")
                    chai.spy.restore(dbConnector, "execute");
                    done();
                });
        });
        it("should throw error when dataset id does not exists", (done) => {
            chai.spy.on(ingestorService, "getDatasetConfig", () => {
                return {}
            })
            chai.spy.on(dbConnector, "execute", () => {
                return Promise.resolve([])
            })
            chai
                .request(app)
                .post(config.apiDatasourceSaveEndPoint)
                .send(TestDataSource.VALID_SCHEMA)
                .end((err, res) => {
                    res.should.have.status(httpStatus.NOT_FOUND);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "404_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.save.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                    chai.spy.restore(ingestorService, "getDatasetConfig")
                    chai.spy.restore(dbConnector, "execute");
                    done();
                });
        });
        it("should not insert a record when it already exists in database", (done) => {
            chai.spy.on(ingestorService, "getDatasetConfig", () => {
                return { "id": ":telemetry", "dataset_config": { "entry_topic": "telemetry" }, "router_config": { "topic": "telemetry" } }
            })
            chai.spy.on(dbConnector, "execute", () => {
                return Promise.resolve([ {} ])
            })
            chai
                .request(app)
                .post(config.apiDatasourceSaveEndPoint)
                .send(TestDataSource.VALID_SCHEMA)
                .end((err, res) => {
    
                    res.should.have.status(httpStatus.CONFLICT);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "409_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.save.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                    chai.spy.restore(ingestorService, "getDatasetConfig")
                    chai.spy.restore(dbConnector, "execute");
                    done();
                });
        });
        it("should throw error", (done) => {
            chai.spy.on(ingestorService, "getDatasetConfig", () => {
                return { "id": ":telemetry", "dataset_config": { "entry_topic": "telemetry" }, "router_config": { "topic": "telemetry" } }
            })
            chai.spy.on(dbConnector, "execute", () => {
                return Promise.resolve([])
            })
            chai.spy.on(ResponseHandler, "successResponse", () => {
                throw new Error("Error occured while sending response")
            })
            chai
                .request(app)
                .post(config.apiDatasourceSaveEndPoint)
                .send(TestDataSource.VALID_SCHEMA)
                .end((err, res) => {
                    res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "500_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.save.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                    chai.spy.restore(ingestorService, "getDatasetConfig")
                    chai.spy.restore(dbConnector, "execute");
                    chai.spy.restore(ResponseHandler, "successResponse")
                    done();
                });
        });
        it("should not insert record in the database", (done) => {
            chai.spy.on(ingestorService, "getDatasetConfig", () => {
                return { "id": ":telemetry", "dataset_config": { "entry_topic": "telemetry" }, "router_config": { "topic": "telemetry" } }
            })
            chai.spy.on(dbConnector, "execute", () => {
                return Promise.reject(new Error("error occured while connecting to postgres"))
            })
            chai
                .request(app)
                .post(config.apiDatasourceSaveEndPoint)
                .send(TestDataSource.VALID_SCHEMA)
                .end((err, res) => {
                    res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "500_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.save.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                    chai.spy.restore(ingestorService, "getDatasetConfig")
                    chai.spy.restore(dbConnector, "execute");
                    done();
                });
        });
        it("should not insert record when request object contains missing fields", (done) => {
            chai.spy.on(ingestorService, "getDatasetConfig", () => {
                return { "id": ":telemetry", "dataset_config": { "entry_topic": "telemetry" }, "router_config": { "topic": "telemetry" } }
            })
            chai
                .request(app)
                .post(config.apiDatasourceSaveEndPoint)
                .send(TestDataSource.MISSING_REQUIRED_FIELDS_CREATE)
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "400_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.save.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                    chai.spy.restore(ingestorService, "getDatasetConfig")
                    done();
                });
        })
        it("should not insert record when given invalid schema", (done) => {
            chai.spy.on(ingestorService, "getDatasetConfig", () => {
                return { "id": ":telemetry", "dataset_config": { "entry_topic": "telemetry" }, "router_config": { "topic": "telemetry" } }
            })
            chai
                .request(app)
                .post(config.apiDatasourceSaveEndPoint)
                .send(TestDataSource.INVALID_SCHEMA)
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "400_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.save.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                    chai.spy.restore(ingestorService, "getDatasetConfig")
                    done();
                });
        })
    })
    describe("Datasource update API", () => {
        it("should not update records in database", (done) => {
            chai.spy.on(ingestorService, "getDatasetConfig", () => {
                return { "id": ":telemetry", "dataset_config": { "entry_topic": "telemetry" }, "router_config": { "topic": "telemetry" } }
            })
            chai.spy.on(dbConnector, "execute", () => {
                return Promise.reject(new Error("error occured while connecting to postgres"))
            })
            chai
                .request(app)
                .patch(config.apiDatasourceUpdateEndPoint)
                .send(TestDataSource.VALID_UPDATE_SCHEMA)
                .end((err, res) => {
                    res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "500_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.update.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                    chai.spy.restore(ingestorService, "getDatasetConfig")
                    chai.spy.restore(dbConnector, "execute")
                    done();
                });
        });
        it("should successfully update records in database", (done) => {
            chai.spy.on(ingestorService, "getDatasetConfig", () => {
                return { "id": ":telemetry", "dataset_config": { "entry_topic": "telemetry" }, "router_config": { "topic": "telemetry" } }
            })
            chai.spy.on(dbConnector, "execute", () => {
                return Promise.resolve({})
            })
            chai
                .request(app)
                .patch(config.apiDatasourceUpdateEndPoint)
                .send(TestDataSource.VALID_SCHEMA)
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "200_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.update.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.SUCCESS)
                    res.body.result.message.should.be.eq(constants.RECORD_UPDATED)
                    chai.spy.restore(ingestorService, "getDatasetConfig")
                    chai.spy.restore(dbConnector, "execute")
                    done();
                });
        });
    
        it("should not update records when request object does not contain required fields", (done) => {
            chai.spy.on(ingestorService, "getDatasetConfig", () => {
                return { "id": ":telemetry", "dataset_config": { "entry_topic": "telemetry" }, "router_config": { "topic": "telemetry" } }
            })
            chai
                .request(app)
                .patch(config.apiDatasourceUpdateEndPoint)
                .send(TestDataSource.MISSING_REQUIRED_FIELDS_UPDATE)
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "400_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.update.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                    chai.spy.restore(ingestorService, "getDatasetConfig")
                    done();
                });
        });
    
    })
    describe("Datasource read API", () => {
        it("should successfully retrieve records from database", (done) => {
            chai.spy.on(dbConnector, "execute", () => {
                return Promise.resolve([ TestDataSource.VALID_RECORD ])
            })
            chai
                .request(app)
                .get(config.apiDatasourceReadEndPoint.replace(":datasourceId", TestDataSource.SAMPLE_ID).concat('?status=ACTIVE'))
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "200_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.read.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.SUCCESS)
                    res.body.result.should.be.a("object")
                    chai.spy.restore(dbConnector, "execute")
                    done();
                })
        }),
            it("should successfully retrieve records from database", (done) => {
                chai.spy.on(dbConnector, "execute", () => {
                    return Promise.resolve([ TestDataSource.VALID_RECORD ])
                })
                chai
                    .request(app)
                    .get(config.apiDatasourceReadEndPoint.replace(":datasourceId", TestDataSource.SAMPLE_ID))
                    .end((err, res) => {
                        res.should.have.status(httpStatus.OK);
                        res.body.should.be.a("object");
                        res.body.responseCode.should.be.eq(httpStatus[ "200_NAME" ]);
                        res.body.should.have.property("result");
                        res.body.id.should.be.eq(routesConfig.config.datasource.read.api_id);
                        res.body.params.status.should.be.eq(constants.STATUS.SUCCESS)
                        res.body.result.should.be.a("object")
                        chai.spy.restore(dbConnector, "execute")
                        done();
                    })
            }),
            it("should throw error if records are empty", (done) => {
                chai.spy.on(dbConnector, "execute", () => {
                    return Promise.resolve([])
                })
                chai
                    .request(app)
                    .get(config.apiDatasourceReadEndPoint.replace(":datasourceId", TestDataSource.SAMPLE_ID).concat('?status=ACTIVE'))
                    .end((err, res) => {
                        res.should.have.status(httpStatus.NOT_FOUND);
                        res.body.should.be.a("object");
                        res.body.responseCode.should.be.eq(httpStatus[ "404_NAME" ]);
                        res.body.should.have.property("result");
                        res.body.id.should.be.eq(routesConfig.config.datasource.read.api_id);
                        res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                        chai.spy.restore(dbConnector, "execute")
                        done();
                    })
            }),
            it("should not retrieve records", (done) => {
                chai.spy.on(dbConnector, "execute", () => {
                    return Promise.reject(new Error("error while connecting to postgres"))
                })
                chai
                    .request(app)
                    .get(config.apiDatasourceReadEndPoint.replace(":datasourceId", TestDataSource.SAMPLE_ID).concat('?status=ACTIVE'))
                    .end((err, res) => {
                        res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                        res.body.should.be.a("object");
                        res.body.responseCode.should.be.eq(httpStatus[ "500_NAME" ]);
                        res.body.should.have.property("result");
                        res.body.id.should.be.eq(routesConfig.config.datasource.read.api_id);
                        res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                        chai.spy.restore(dbConnector, "execute")
                        done();
                    })
            })
    
    })
    describe("Datasource list API", () => {
        it("should successfully list records in the table", (done) => {
            chai.spy.on(dbConnector, "execute", () => {
                return Promise.resolve([ {} ])
            })
            chai
                .request(app)
                .post(config.apiDatasourceListEndPoint)
                .send(TestDataSource.VALID_LIST_REQUEST_DISABLED_STATUS)
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "200_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.list.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.SUCCESS)
                    res.body.result.should.be.a("array")
                    chai.spy.restore(dbConnector, "execute")
                    done();
                });
        })
        it("should not list records if request object is invalid", (done) => {
            chai
                .request(app)
                .post(config.apiDatasourceListEndPoint)
                .send({ "filters": true })
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "400_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.list.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                    done();
                });
        })
        it("should not list records", (done) => {
            chai.spy.on(dbConnector, "execute", () => {
                return Promise.reject(new Error("error while connecting to postgres"))
            })
            chai
                .request(app)
                .post(config.apiDatasourceListEndPoint)
                .send(TestDataSource.VALID_LIST_REQUEST_ACTIVE_STATUS)
                .end((err, res) => {
                    res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus[ "500_NAME" ]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routesConfig.config.datasource.list.api_id);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                    chai.spy.restore(dbConnector, "execute")
                    done();
                })
        })
    })
})

