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

const druidHost = config?.query_api?.druid?.host;
const druidPort = config?.query_api?.druid?.port;
const listDruidDatasources = config?.query_api?.druid?.list_datasources_path;
const nativeQueryEndpointDruid = config?.query_api?.druid?.native_query_path;
const sqlQueryEndpoint = config?.query_api?.druid?.sql_query_path;

const response = [{ dataValues: { datasource_ref: "test.1_rollup_week", metadata: { aggregated: true, granularity: "week" } } }]
const msgid = "e180ecac-8f41-4f21-9a21-0b3a1a368917";

describe("QUERY API TESTS", () => {

    afterEach(() => {
        chai.spy.restore()
        nock.cleanAll();
    })

    it("Query api failure: Datasource not found in druid", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(
                response
            )
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ['telemetry-events.1_rollup'])
        chai
            .request(app)
            .post("/v2/data/query/telemetry-events")
            .send(JSON.parse(TestQueries.VALID_QUERY))
            .end((err, res) => {
                res.should.have.status(404);
                res.body.params.status.should.be.eq("FAILED");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.responseCode.should.be.eq("NOT_FOUND");
                res.body.error.message.should.be.eq("Dataset telemetry-events with table week is not available for querying");
                res.body.error.code.should.be.eq("DATA_OUT_SOURCE_NOT_FOUND");
                done();
            });
    });

    it("Query api failure: Datasource not found in live table", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve([])
        })
        chai
            .request(app)
            .post("/v2/data/query/telemetry-events")
            .send(JSON.parse(TestQueries.VALID_QUERY))
            .end((err, res) => {
                res.should.have.status(404);
                res.body.params.status.should.be.eq("FAILED");
                res.body.responseCode.should.be.eq("NOT_FOUND");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.error.message.should.be.eq("Datasource telemetry-events not available for querying");
                res.body.error.code.should.be.eq("DATA_OUT_SOURCE_NOT_FOUND");
                done();
            });
    });

    it("Query api failure : when druid is down, it should raise error when native query endpoint is called", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(response)
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["test.1_rollup_week"])
        nock(druidHost + ":" + druidPort)
            .post(nativeQueryEndpointDruid)
            .reply(500)
        chai
            .request(app)
            .post("/v2/data/query/telemetry-events")
            .send(JSON.parse(TestQueries.VALID_QUERY))
            .end((err, res) => {
                res.should.have.status(500);
                res.body.params.status.should.be.eq("FAILED");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                res.body.error.message.should.be.eq("Unable to process the query.");
                res.body.error.code.should.be.eq("INTERNAL_SERVER_ERROR");
                res.body.responseCode.should.be.eq("INTERNAL_SERVER_ERROR");
                done();
            });
    });

    it("Query api failure : when druid is down, it should raise error when sql query endpoint is called", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(response)
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["test.1_rollup_week"])
        nock(druidHost + ":" + druidPort)
            .post(sqlQueryEndpoint)
            .reply(500)
        chai
            .request(app)
            .post("/v2/data/query/telemetry-events")
            .send(JSON.parse(TestQueries.VALID_SQL_QUERY))
            .end((err, res) => {
                res.should.have.status(500);
                res.body.params.status.should.be.eq("FAILED");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                res.body.error.message.should.be.eq("Unable to process the query.");
                res.body.error.code.should.be.eq("INTERNAL_SERVER_ERROR");
                res.body.responseCode.should.be.eq("INTERNAL_SERVER_ERROR");
                done();
            });
    });

    it("Query api success : it should fetch information from druid data source for native query", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(response)
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["test.1_rollup_week"])
        nock(druidHost + ":" + druidPort)
            .post(nativeQueryEndpointDruid)
            .reply(200, [{ events: [] }]);
        chai
            .request(app)
            .post("/v2/data/query/telemetry-events")
            .send(JSON.parse(TestQueries.VALID_QUERY))
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("OK");
                res.body.should.have.property("result");
                res.body.result.length.should.be.lessThan(101);
                res.body.id.should.be.eq("api.data.out");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                done();
            });
    });

    it("Query api success : it should fetch information from druid data source for native query for valid interval", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(response)
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["test.1_rollup_week"])
        nock(druidHost + ":" + druidPort)
            .post(nativeQueryEndpointDruid)
            .reply(200, [{ events: [] }]);
        chai
            .request(app)
            .post("/v2/data/query/telemetry-events")
            .send(JSON.parse(TestQueries.VALID_INTERVAL))
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("OK");
                res.body.should.have.property("result");
                res.body.result.length.should.be.lessThan(101);
                res.body.id.should.be.eq("api.data.out");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                done();
            });
    });

    it("Query api success : it should allow druid to query when a valid sql query is given", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(response)
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["test.1_rollup_week"])
        nock(druidHost + ":" + druidPort)
            .post(sqlQueryEndpoint)
            .reply(200, [{ events: [] }]);
        chai
            .request(app)
            .post("/v2/data/query/telemetry-events")
            .send(JSON.parse(TestQueries.VALID_SQL_QUERY))
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("OK");
                res.body.should.have.property("result");
                res.body.id.should.be.eq("api.data.out");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                done();
            });
    });

    it("Query api failure : schema validation", (done) => {
        chai
            .request(app)
            .post("/v2/data/query/telemetry-events")
            .send(JSON.parse(TestQueries.HIGH_LIMIT_SQL_QUERY))
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                res.body.params.status.should.be.eq("FAILED");
                res.body.error.message.should.be.eq("#required should have required property 'query'");
                res.body.error.code.should.be.eq("DATA_OUT_INVALID_INPUT")
                res.body.id.should.be.eq("api.data.out");
                done();
            });
    });

    it("it should set threshold to default when threshold is greater than maximum threshold", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(response)
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["test.1_rollup_week"])
        nock(druidHost + ":" + druidPort)
            .post(sqlQueryEndpoint)
            .reply(200);
        chai
            .request(app)
            .post("/v2/data/query/telemetry-events")
            .send(JSON.parse(TestQueries.VALID_SQL_QUERY_WITHOUT_LIMIT))
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("OK");
                res.body.id.should.be.eq("api.data.out");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                done();
            });
    });

    it("it should set threshold to number when it is NaN in sql query", (done) => {
        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(response)
        })
        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["telemetry-events.1_rollup_week"])
        nock(druidHost + ":" + druidPort)
            .post(nativeQueryEndpointDruid)
            .reply(200);
        chai
            .request(app)
            .post("/v2/data/query/telemetry-events")
            .send(JSON.parse(TestQueries.HIGH_LIMIT_NATIVE_QUERY))
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object");
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                res.body.id.should.be.eq("api.data.out");
                res.body.params.status.should.be.eq("FAILED");
                res.body.error.message.should.be.eq("Invalid date range! the date range cannot be a null value");
                res.body.error.code.should.be.eq("DATA_OUT_INVALID_DATE_RANGE")
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                done();
            });
    });
})