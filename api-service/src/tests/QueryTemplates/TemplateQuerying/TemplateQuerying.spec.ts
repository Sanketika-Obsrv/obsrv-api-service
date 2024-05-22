import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import { describe, it } from 'mocha';
import _ from "lodash";
import { QueryTemplate } from "../../../models/QueryTemplate";
import { Datasource } from "../../../models/Datasource";
import nock from "nock";
import { config } from "../../../configs/Config";
import { templateQueryApiFixtures } from "./Fixtures";
const apiId = 'api.query.template.query';
const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6d"

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const druidHost = config?.query_api?.druid?.host;
const druidPort = config?.query_api?.druid?.port;
const listDruidDatasources = config?.query_api?.druid?.list_datasources_path;
const nativeQueryEndpointDruid = config?.query_api?.druid?.native_query_path;
const sqlQueryEndpoint = config?.query_api?.druid?.sql_query_path;

const response = [{ dataValues: { datasource_ref: "test.1_rollup_month", metadata: { aggregated: true, granularity: "month" } } }]

describe("QUERY TEMPLATE API", () => {

    afterEach(() => {
        chai.spy.restore();
        nock.cleanAll();
    });

    it("Query template Success: Query successfully executed for sql template", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.resolve({
                dataValues: {
                    template_id: 'sql1',
                    template_name: 'sql1',
                    query: '"SELECT * FROM {{DATASET}} WHERE \"__time\" BETWEEN TIMESTAMP {{STARTDATE}} AND TIMESTAMP {{ENDDATE}}"',
                    query_type: 'sql',
                    created_by: 'SYSTEM',
                    updated_by: 'SYSTEM',
                    created_date: "2024-04 - 30T05: 57:04.387Z",
                    updated_date: "2024-04 - 30T05: 57:04.387Z"
                }
            })
        })

        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(response)
        })

        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["test.1_rollup_month"])
        nock(druidHost + ":" + druidPort)
            .post(sqlQueryEndpoint)
            .reply(200, [{ events: [] }]);

        chai
            .request(app)
            .post("/v2/template/query/sql1")
            .send(templateQueryApiFixtures.VALID_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.id.should.be.eq(apiId);
                res.body.responseCode.should.be.eq("OK");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("array");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                done();
            });
    })

    it("Query template Success: Query successfully executed for JSON template", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.resolve({
                dataValues: {
                    template_id: 'jsontemplate1',
                    template_name: 'jsontemplate1',
                    query: '{"queryType":"timeseries","datasetId":"{{DATASET}}","intervals":"{{STARTDATE}}/{{ENDDATE}}","limit":"{{LIMIT}}","aggregations":[{"type":"filtered","aggregator":{"type":"count","name":"a0"},"filter":{"type":"not","field":{"type":"null","column":"school_id"}},"name":"school_id"}]}',
                    query_type: 'json',
                    created_by: 'SYSTEM',
                    updated_by: 'SYSTEM',
                    created_date: "2024-04-28T23:28:35.868Z",
                    updated_date: "2024-04-28T23:28:35.868Z"
                }
            })
        })

        chai.spy.on(Datasource, "findAll", () => {
            return Promise.resolve(response)
        })

        nock(druidHost + ":" + druidPort)
            .get(listDruidDatasources)
            .reply(200, ["test.1_rollup_month"])

        nock(druidHost + ":" + druidPort)
            .post(nativeQueryEndpointDruid)
            .reply(200, [{ events: [] }]);

        chai
            .request(app)
            .post("/v2/template/query/jsontemplate1")
            .send(templateQueryApiFixtures.VALID_REQUEST_BODY_NATIVE_TEMPLATE)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.id.should.be.eq(apiId);
                res.body.responseCode.should.be.eq("OK");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("array");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                done();
            });
    })

    it("Query template Failure: failed to parse the query", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.resolve({
                dataValues: {
                    template_id: 'jsontemplate1',
                    template_name: 'jsontemplate1',
                    query: '{"queryType":"timeseries","datasetId"::::"{{DATASET}}","intervals":"{{STARTDATE}}/{{ENDDATE}}","limit":"{{LIMIT}}","aggregations":[{"type":"filtered","aggregator":{"type":"count","name":"a0"},"filter":{"type":"not","field":{"type":"null","column":"school_id"}},"name":"school_id"}]}',
                    query_type: 'json',
                    created_by: 'SYSTEM',
                    updated_by: 'SYSTEM',
                    created_date: "2024-04-28T23:28:35.868Z",
                    updated_date: "2024-04-28T23:28:35.868Z"
                }
            })
        })

        chai
            .request(app)
            .post("/v2/template/query/jsontemplate1")
            .send(templateQueryApiFixtures.VALID_REQUEST_BODY_NATIVE_TEMPLATE)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.id.should.be.eq(apiId);
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("Failed to parse the query");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_INVALID_INPUT");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                done();
            });
    })

    it("Query template Failure: Request body validation", (done) => {
        chai
            .request(app)
            .post("/v2/template/query/sql1")
            .send(templateQueryApiFixtures.INVALID_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("#properties/request/required should have required property 'startdate'");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_INVALID_INPUT");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                done();
            });
    })

    it("Query template Failure: Template not found", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.resolve(null)
        })
        chai
            .request(app)
            .post("/v2/template/query/sql1")
            .send(templateQueryApiFixtures.VALID_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(404);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.responseCode.should.be.eq("NOT_FOUND");
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("Template sql1 does not exists");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_NOT_EXISTS");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                done();
            });
    })

    it("Query template Failure: Database connection failure", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.reject({})
        })
        chai
            .request(app)
            .post("/v2/template/query/sql1")
            .send(templateQueryApiFixtures.VALID_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(500);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.responseCode.should.be.eq("INTERNAL_SERVER_ERROR");
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("Unable to process the query");
                res.body.error.code.should.be.eq("INTERNAL_SERVER_ERROR");
                res.body.params.msgid.should.be.eq(msgid);
                res.body.params.should.have.property("resmsgid");
                done();
            });
    })
})