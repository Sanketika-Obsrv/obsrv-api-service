import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import nock from "nock";
import { TestQueries } from "./Fixtures";
import { config } from "../../../configs/Config";
import chaiSpies from 'chai-spies'
import { describe, it } from 'mocha';
import { Datasource } from "../../../models/Datasource";
chai.use(chaiSpies)
chai.should();
chai.use(chaiHttp);

const apiEndpoint = "/v1/data/query/:datasetId"
const druidHost = config?.query_api?.druid?.host;
const druidPort = config?.query_api?.druid?.port;
const listDruidDatasources = config?.query_api?.druid?.list_datasources_path;
const nativeQueryEndpointDruid = config?.query_api?.druid?.native_query_path;
const sqlQueryEndpoint = config?.query_api?.druid?.sql_query_path;

describe("QUERY API TESTS", () => {

    afterEach(() => {
        chai.spy.restore(Datasource, "findAll")
    })

    it("when druid is down, it should raise error when native query endpoint is called", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(
                [{
                    dataValues: {
                        datasource_ref: "telemetry-events.1_rollup_week"
                    }
                }]
            )
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ['telemetry-events.1_rollup_week'])
        nock(druidHost + ":" + druidPort)
            .post(nativeQueryEndpointDruid)
            .reply(500)
        chai
            .request(app)
            .post(apiEndpoint)
            .send(JSON.parse(TestQueries.VALID_QUERY))
            .end((err, res) => {
                res.should.have.status(500);
                res.body.params.status.should.be.eq("FAILED");
                res.body.error.message.should.be.eq("Unable to process the query.");
                res.body.error.code.should.be.eq("INTERNAL_SERVER_ERROR");
                nock.cleanAll();
                chai.spy.restore(Datasource, "findAll")
                done();
            });
    });

    it("when druid is down, it should raise error when sql query endpoint is called", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve([{
                dataValues: {
                    datasource_ref: "telemetry-events.1_rollup_week"
                }
            }])
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["telemetry-events.1_rollup_week"])
        nock(druidHost + ":" + druidPort)
            .post(sqlQueryEndpoint)
            .reply(500)
        chai
            .request(app)
            .post(apiEndpoint)
            .send(JSON.parse(TestQueries.VALID_SQL_QUERY))
            .end((err, res) => {
                res.should.have.status(500);
                res.body.params.status.should.be.eq("FAILED");
                res.body.error.message.should.be.eq("Unable to process the query.");
                res.body.error.code.should.be.eq("INTERNAL_SERVER_ERROR");
                nock.cleanAll();
                chai.spy.restore(Datasource, "findAll")
                done();
            });
    });

    it("live datasource not found!", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.reject([])
        })
        chai
            .request(app)
            .post(apiEndpoint)
            .send(JSON.parse(TestQueries.VALID_QUERY))
            .end((err, res) => {
                res.should.have.status(404);
                res.body.params.status.should.be.eq("FAILED");
                res.body.error.message.should.be.eq("Datasource not found");
                res.body.responseCode.should.be.eq("NOT_FOUND");
                res.body.error.code.should.be.eq("DATASOURCE_NOT_FOUND");
                nock.cleanAll();
                chai.spy.restore(Datasource, "findAll")
                done();
            });
    });

    it("it should fetch information from druid data source", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return [{ "datasource_ref": "sample_ref" }]
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["sample_ref"])
        nock(druidHost + ":" + druidPort)
            .post(nativeQueryEndpointDruid)
            .reply(200, [{ events: [] }]);
        chai
            .request(app)
            .post(apiEndpoint)
            .send(JSON.parse(TestQueries.VALID_QUERY))
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("OK");
                res.body.should.have.property("result");
                res.body.result.length.should.be.lessThan(101);
                res.body.id.should.be.eq("api.data.out");
                nock.cleanAll()
                chai.spy.restore(Datasource, "findAll")
                done();
            });
    });

    it("it should allow druid to query when a valid sql query is given", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return [{ "datasource_ref": "sample_ref" }]
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["sample_ref"])
        nock(druidHost + ":" + druidPort)
            .post(sqlQueryEndpoint)
            .reply(200, [{ events: [] }]);
        chai
            .request(app)
            .post(apiEndpoint)
            .send(JSON.parse(TestQueries.VALID_SQL_QUERY))
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("OK");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api.data.out");
                nock.cleanAll();
                chai.spy.restore(Datasource, "findAll");
                done();
            });
    });

    it("it should set threshold to default when threshold is not given", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve([{
                dataValues: {
                    datasource_ref: "telemetry-events.1_rollup_week"
                }
            }])
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["telemetry-events.1_rollup_week"])
        nock(druidHost + ":" + druidPort)
            .post(nativeQueryEndpointDruid)
            .reply(200, [{ events: [] }]);
        chai
            .request(app)
            .post(apiEndpoint)
            .send(JSON.parse(TestQueries.WITHOUT_THRESOLD_QUERY))
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("OK");
                res.body.id.should.be.eq("api.data.out");
                nock.cleanAll()
                chai.spy.restore(Datasource, "findAll")
                done();
            });
    });

    it("schema validation", (done) => {
        chai
            .request(app)
            .post(apiEndpoint)
            .send(JSON.parse(TestQueries.HIGH_LIMIT_SQL_QUERY))
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                res.body.params.status.should.be.eq("FAILED");
                res.body.error.message.should.be.eq("#required should have required property 'query'");
                res.body.error.code.should.be.eq("DATA_QUERY_INVALID_INPUT")
                res.body.id.should.be.eq("api.data.out");
                done();
            });
    });

    it("invalid date range", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            Promise.resolve([{
                dataValues: {
                    datasource_ref: "telemetry-events.1_rollup_week"
                }
            }])
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["telemetry-events.1_rollup_week"])
        nock(druidHost + ":" + druidPort)
            .post(nativeQueryEndpointDruid)
            .reply(200, [{ events: [] }]);
        chai
            .request(app)
            .post("/v1/data/query/telemetry-events")
            .send(JSON.parse(TestQueries.HIGH_DATE_RANGE_SQL_QUERY))
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                res.body.id.should.be.eq("api.data.out");
                res.body.params.status.should.be.eq("FAILED");
                res.body.error.message.should.be.eq("Invalid date range! make sure your range cannot be more than 30 days");
                res.body.error.code.should.be.eq("INVALID_DATE_RANGE")
                nock.cleanAll()
                chai.spy.restore(Datasource, "findAll")
                done();
            });
    });

    it("invalid date range NATIVE query", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            Promise.resolve([{
                dataValues: {
                    datasource_ref: "telemetry-events.1_rollup_week"
                }
            }])
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["telemetry-events.1_rollup_week"])
        nock(druidHost + ":" + druidPort)
            .post(nativeQueryEndpointDruid)
            .reply(200, [{ events: [] }]);
        chai
            .request(app)
            .post("/v1/data/query/telemetry-events")
            .send(JSON.parse(TestQueries.INVALID_DATE_RANGE_NATIVE))
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                res.body.id.should.be.eq("api.data.out");
                res.body.params.status.should.be.eq("FAILED");
                res.body.error.message.should.be.eq("Invalid date range! make sure your range cannot be more than 30 days");
                res.body.error.code.should.be.eq("INVALID_DATE_RANGE");
                nock.cleanAll()
                chai.spy.restore(Datasource, "findAll")
                done();
            });
    });

    it("it should set threshold to default when threshold is greater than maximum threshold", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve([{
                dataValues: {
                    datasource_ref: "telemetry-events.1_rollup_week"
                }
            }])
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["telemetry-events.1_rollup_week"])
        nock(druidHost + ":" + druidPort)
            .post(nativeQueryEndpointDruid)
            .reply(200);
        chai
            .request(app)
            .post(apiEndpoint)
            .send(JSON.parse(TestQueries.HIGH_LIMIT_NATIVE_QUERY))
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("OK");
                res.body.id.should.be.eq("api.data.out");
                nock.cleanAll()
                chai.spy.restore(Datasource, "findAll")
                done();
            });
    });

    it("it should set threshold to number when it is NaN in sql query", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve([{
                dataValues: {
                    datasource_ref: "telemetry-events.1_rollup_week"
                }
            }])
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["telemetry-events.1_rollup_week"])
        nock(druidHost + ":" + druidPort)
            .post(sqlQueryEndpoint)
            .reply(200);
        chai
            .request(app)
            .post(apiEndpoint)
            .send(JSON.parse(TestQueries.LIMIT_IS_NAN))
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("OK");
                res.body.id.should.be.eq("api.data.out");
                nock.cleanAll()
                chai.spy.restore(Datasource, "findAll")
                done();
            });
    });

    it("when datasource list is empty", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve([])
        })

        chai
            .request(app)
            .post(apiEndpoint)
            .send(JSON.parse(TestQueries.DATASOURCE_NOT_FOUND))
            .end((err, res) => {
                res.should.have.status(404);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("NOT_FOUND");
                res.body.params.status.should.be.eq("FAILED");
                res.body.id.should.be.eq("api.data.out");
                nock.cleanAll()
                chai.spy.restore(Datasource, "findAll")
                done();
            });
    });
})