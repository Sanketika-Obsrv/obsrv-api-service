import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import { describe, it } from 'mocha';
import _ from "lodash";
import { QueryTemplate } from "../../../models/QueryTemplate";
import { listTemplateFixtures } from "./Fixtures";
const apiId = 'api.query.template.list'
const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6d";
chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("LIST QUERY TEMPLATE API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("List templates success: should list all templates", (done) => {
        chai.spy.on(QueryTemplate, "findAll", () => {
            return Promise.resolve(listTemplateFixtures.EMPTY_REQUEST_RESPONSE)
        })

        const response = listTemplateFixtures.EMPTY_REQUEST_RESPONSE.map((record: any) => { return (record?.dataValues) });
        chai
            .request(app)
            .post("/v2/template/list")
            .send(listTemplateFixtures.WITH_EMPTY_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.params.status.should.be.eq("SUCCESS");
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify(response))
                res.body.params.msgid.should.be.eq(msgid)
                done();
            });
    })

    it("List templates success: should list all templates in ascending order", (done) => {
        chai.spy.on(QueryTemplate, "findAll", () => {
            return Promise.resolve(listTemplateFixtures.ORDER_BY_RESPONSE)
        })

        const response = listTemplateFixtures.ORDER_BY_RESPONSE.map((record: any) => { return (record?.dataValues) });
        chai
            .request(app)
            .post("/v2/template/list")
            .send(listTemplateFixtures.ORDER_BY_REQUEST)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.params.status.should.be.eq("SUCCESS");
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify(response))
                res.body.params.msgid.should.be.eq(msgid)
                done();
            });
    })

    it("List templates success: should list all templates of type sql", (done) => {
        chai.spy.on(QueryTemplate, "findAll", () => {
            return Promise.resolve(listTemplateFixtures.FILTER_RESPONSE)
        })

        const response = listTemplateFixtures.FILTER_RESPONSE.map((record: any) => { return (record?.dataValues) });
        chai
            .request(app)
            .post("/v2/template/list")
            .send(listTemplateFixtures.FILTER_REQUEST)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.params.status.should.be.eq("SUCCESS");
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify(response))
                res.body.params.msgid.should.be.eq(msgid)
                done();
            });
    })

    it("List templates success: should list only 5 templates", (done) => {
        chai.spy.on(QueryTemplate, "findAll", () => {
            return Promise.resolve(listTemplateFixtures.EMPTY_REQUEST_RESPONSE)
        })

        const response = listTemplateFixtures.EMPTY_REQUEST_RESPONSE.map((record: any) => { return (record?.dataValues) });
        chai
            .request(app)
            .post("/v2/template/list")
            .send(listTemplateFixtures.LIMIT_AND_OFFSET_REQUEST)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.params.status.should.be.eq("SUCCESS");
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify(response))
                res.body.params.msgid.should.be.eq(msgid)
                done();
            });
    })


    it("List templates failure: Invalid request body", (done) => {
        chai.spy.on(QueryTemplate, "findAll", () => {
            return Promise.resolve([])
        })
        chai
            .request(app)
            .post("/v2/template/list")
            .send(listTemplateFixtures.INVALID_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("#required should have required property 'id'")
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_INVALID_INPUT")
                done();
            });
    })

    it("List template Failure: Database connection failure", (done) => {
        chai.spy.on(QueryTemplate, "findAll", () => {
            return Promise.reject({})
        })
        chai
            .request(app)
            .post("/v2/template/list")
            .send(listTemplateFixtures.WITH_EMPTY_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(500);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.responseCode.should.be.eq("INTERNAL_SERVER_ERROR");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Failed to list query templates");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_LIST_FAILED")
                done();
            });
    })
})