import app from "../app";
import chai from "chai";
import chaiHttp from "chai-http";
import nock from "nock";
import httpStatus from "http-status";
import { TestDruidQuery } from "./Fixtures";
import { config } from "./Config";
import constants from "../resources/Constants.json";
import { routesConfig } from "../configs/RoutesConfig";
import { dbConnector } from "../routes/Router";
import { QueryValidator } from "../validators/QueryValidator";
import chaiSpies from 'chai-spies'
import { describe, it } from 'mocha';
chai.use(chaiSpies)
chai.should();
chai.use(chaiHttp);

describe("QUERY API", () => {

    describe("If service is down", () => {

        it("it should raise error when native query endpoint is called", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidEndPoint)
                .reply(500)
            chai
                .request(app)
                .post(config.apiDruidEndPoint)
                .send(JSON.parse(TestDruidQuery.VALID_QUERY))
                .end((err, res) => {
                    res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                    res.body.responseCode.should.be.eq(httpStatus["500_NAME"]);
                    nock.cleanAll();
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                });
        });
        it("should raise error when sql query endpoint is called", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [{ "datasource_ref": "sample_ref" }]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidSqlEndPoint)
                .reply(500)
            chai
                .request(app)
                .post(config.apiDruidSqlEndPoint)
                .send(JSON.parse(TestDruidQuery.VALID_SQL_QUERY))
                .end((err, res) => {
                    res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                    res.body.responseCode.should.be.eq(httpStatus["500_NAME"]);
                    nock.cleanAll();
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                });
        });
    });
    describe("POST /query/v2/native-query", () => {
        it("it should fetch information from druid data source", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidEndPoint)
                .send(JSON.parse(TestDruidQuery.VALID_QUERY))
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                    res.body.should.have.property("result");
                    res.body.result.length.should.be.lessThan(101);
                    res.body.id.should.be.eq(routesConfig.query.native_query.api_id);
                    nock.cleanAll()
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                });
        });
        it("it should reject query, when datarange given as list is higher than limit", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidEndPoint)
                .send(JSON.parse(TestDruidQuery.HIGH_DATE_RANGE_GIVEN_AS_LIST))
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE);
                    res.body.result.should.be.empty;
                    res.body.id.should.be.eq(routesConfig.query.native_query.api_id);
                    nock.cleanAll()
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                });
        });
        it("it should reject query, when datarange given as string is higher than limit", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidEndPoint)
                .send(JSON.parse(TestDruidQuery.HIGH_DATE_RANGE_GIVEN_AS_STRING))
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE);
                    res.body.result.should.be.empty;
                    res.body.id.should.be.eq(routesConfig.query.native_query.api_id);
                    nock.cleanAll()
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                });
        });
        it("it should set threshold to default when given threshold is higher than limit", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidEndPoint)
                .send(JSON.parse(TestDruidQuery.HIGH_THRESHOLD_QUERY)) // given threshold is 1K
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                    res.body.result.length.should.be.lessThan(101); // default is 100
                    res.body.id.should.be.eq(routesConfig.query.native_query.api_id);
                    nock.cleanAll()
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                });
        });
        it("it should set row_limit to default when given row_limit is higher than limit", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidEndPoint)
                .send(JSON.parse(TestDruidQuery.HIGH_LIMIT_QUERY)) // given row_limit is 1K
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                    res.body.result.length.should.be.lessThan(101); // default is 100
                    res.body.id.should.be.eq(routesConfig.query.native_query.api_id);
                    nock.cleanAll()
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                });
        });
        it("it should set threshold to default when threshold is not given", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidEndPoint)
                .send(JSON.parse(TestDruidQuery.WITHOUT_THRESOLD_QUERY))
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                    res.body.result.length.should.be.lessThan(101); // default is 100
                    res.body.id.should.be.eq(routesConfig.query.native_query.api_id);
                    nock.cleanAll()
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                });
        });
        it("it should reject query when date range is not given", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidEndPoint)
                .send(JSON.parse(TestDruidQuery.WITHOUT_DATE_RANGE_QUERY))
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE);
                    res.body.result.should.be.empty;
                    res.body.id.should.be.eq(routesConfig.query.native_query.api_id);
                    nock.cleanAll()
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                });
        });
        it("it should skip validation and allow druid for query if rules does not exist for datasource", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidEndPoint)
                .send(JSON.parse(TestDruidQuery.UNSUPPORTED_DATA_SOURCE))
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.SUCCESS);
                    res.body.id.should.be.eq(routesConfig.query.native_query.api_id);
                    nock.cleanAll()
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                });
        });
        it("it should skip validation", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidEndPoint)
                .send(JSON.parse(TestDruidQuery.SKIP_VALIDATION_NATIVE))
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.SUCCESS);
                    res.body.id.should.be.eq(routesConfig.query.native_query.api_id);
                    nock.cleanAll()
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                });
        });
        it("it should reject query with unsupported schema", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidEndPoint)
                .send(JSON.parse(TestDruidQuery.UNSUPPORTED_SCHEMA))
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE);
                    res.body.result.should.be.empty;
                    res.body.id.should.be.eq(routesConfig.query.native_query.api_id);
                    nock.cleanAll()
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                });
        });
        it("it should reject the query because of incorrect url", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .get("/invalid/endpoint")
                .end((err, res) => {
                    res.should.have.status(httpStatus.NOT_FOUND);
                    res.body.should.be.a("object");
                    res.body.id.should.be.eq(routesConfig.default.api_id);
                    res.body.responseCode.should.be.eq(httpStatus["404_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE);
                    res.body.result.should.be.empty;
                    nock.cleanAll()
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                });
        });
    });
    describe("POST /druid/v2/sql", () => {
        it("it should allow druid to query when a valid sql query is given", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidSqlEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidSqlEndPoint)
                .send(JSON.parse(TestDruidQuery.VALID_SQL_QUERY))
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                    res.body.result.length.should.be.lessThan(101);
                    res.body.id.should.be.eq(routesConfig.query.sql_query.api_id);
                    chai.spy.restore(dbConnector, "readRecords")
                    nock.cleanAll()
                    done();
                });
        });
        it("it should update row_limit to default when row_limit is higher than limit", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidSqlEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidSqlEndPoint)
                .send(JSON.parse(TestDruidQuery.HIGH_LIMIT_SQL_QUERY)) // given row_limit is 1K
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                    res.body.result.length.should.be.lessThan(101); // default is 100
                    res.body.id.should.be.eq(routesConfig.query.sql_query.api_id);
                    chai.spy.restore(dbConnector, "readRecords")
                    nock.cleanAll()
                    done();
                });
        });
        it("it should set row_limit to default when none is given", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidSqlEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidSqlEndPoint)
                .send(JSON.parse(TestDruidQuery.WITHOUT_LIMIT_SQL_QUERY))
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                    res.body.result.length.should.be.lessThan(101); // default is 100
                    res.body.id.should.be.eq(routesConfig.query.sql_query.api_id);
                    chai.spy.restore(dbConnector, "readRecords")
                    nock.cleanAll()
                    done();
                });
        });
        it("it should reject the query when daterange range is higher than limit", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidSqlEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidSqlEndPoint)
                .send(JSON.parse(TestDruidQuery.HIGH_DATE_RANGE_SQL_QUERY))
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE);
                    res.body.result.should.be.empty;
                    res.body.id.should.be.eq(routesConfig.query.sql_query.api_id);
                    chai.spy.restore(dbConnector, "readRecords")
                    nock.cleanAll()
                    done();
                });
        });
        it("it should reject the query when no daterange is given", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidSqlEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidSqlEndPoint)
                .send(JSON.parse(TestDruidQuery.WITHOUT_DATE_RANGE_SQL_QUERY))
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE);
                    res.body.result.should.be.empty;
                    res.body.id.should.be.eq(routesConfig.query.sql_query.api_id);
                    chai.spy.restore(dbConnector, "readRecords")
                    nock.cleanAll()
                    done();
                });
        });
        it("it should skip validation and allow druid for query if rules does not exist for datasource ", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidSqlEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidSqlEndPoint)
                .send(JSON.parse(TestDruidQuery.UNSUPPORTED_DATASOURCE_SQL_QUERY))
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.SUCCESS);
                    res.body.id.should.be.eq(routesConfig.query.sql_query.api_id);
                    chai.spy.restore(dbConnector, "readRecords")
                    nock.cleanAll()
                    done();
                })
        })
        it("it should skip validation", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [ { "datasource_ref": "sample_ref" } ]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidSqlEndPoint)
                .reply(200, [ { events: [] } ]);
            chai
                .request(app)
                .post(config.apiDruidSqlEndPoint)
                .send(JSON.parse(TestDruidQuery.SKIP_VALIDATION_SQL))
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.SUCCESS);
                    res.body.id.should.be.eq(routesConfig.query.sql_query.api_id);
                    chai.spy.restore(dbConnector, "readRecords")
                    nock.cleanAll()
                    done();
                })
        })
        it("should throw error for invalid sql query", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [{ "datasource_ref": "sample_ref" }]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, ["sample_ref"])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidSqlEndPoint)
                .reply(200, [{ events: [] }]);
            chai.
                request(app)
                .post(config.apiDruidSqlEndPoint)
                .send(JSON.parse(TestDruidQuery.INVALID_SQL_QUERY))
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE);
                    res.body.id.should.be.eq(routesConfig.query.sql_query.api_id);
                    chai.spy.restore(dbConnector, "readRecords");
                    nock.cleanAll();
                    done();
                })
        })
        it("should throw error is table name is missing from the SQL Query", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                return [{ "datasource_ref": "sample_ref" }]
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, ["sample_ref"])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidSqlEndPoint)
                .reply(200, [{ events: [] }]);
            chai.
                request(app)
                .post(config.apiDruidSqlEndPoint)
                .send(JSON.parse(TestDruidQuery.MISSING_TABLE_NAME))
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE);
                    res.body.id.should.be.eq(routesConfig.query.sql_query.api_id);
                    chai.spy.restore(dbConnector, "readRecords");
                    nock.cleanAll();
                    done();
                })
        })
    })
    describe("error scenarios", () => {
        it("should handle the error", (done) => {
            chai.spy.on(dbConnector, "readRecords", () => {
                throw new Error("error occured while fetching records")
            })
            nock(config.druidHost + ":" + config.druidPort)
                .get(config.druidDatasourcesEndPoint)
                .reply(200, [ "sample_ref" ])
            nock(config.druidHost + ":" + config.druidPort)
                .post(config.druidSqlEndPoint)
                .reply(200, [{ events: [] }]);

            chai
                .request(app)
                .post(config.apiDruidEndPoint)
                .send(JSON.parse(TestDruidQuery.VALID_QUERY))
                .end((err, res) => {
                    res.should.have.status(httpStatus.BAD_REQUEST);
                    res.body.should.be.a("object");
                    res.body.id.should.be.eq(routesConfig.query.native_query.api_id);
                    res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
                    res.body.params.status.should.be.eq(constants.STATUS.FAILURE);
                    res.body.result.should.be.empty;
                    nock.cleanAll()
                    chai.spy.restore(dbConnector, "readRecords")
                    done();
                })
        })
    })
    it("should not validate if called with invalid url", async () => {
        const queryValidator = new QueryValidator()
        await queryValidator.validate({}, "obsrv.api")
            .then((result) => {
                result.isValid.should.be.equal(false)
            })
    })
})