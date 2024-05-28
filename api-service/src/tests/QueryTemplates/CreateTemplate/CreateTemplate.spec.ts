import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import { describe, it } from 'mocha';
import _ from "lodash";
import { createTemplateFixtures } from "./Fixtures"
import { QueryTemplate } from "../../../models/QueryTemplate";
const apiId = 'api.query.template.create'
const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6d";
chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("CREATE QUERY TEMPLATE API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Create template success: should create query template", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.resolve(null)
        })
        chai.spy.on(QueryTemplate, "create", () => {
            return Promise.resolve({ dataValues: { id: "telemetry" } })
        })

        chai
            .request(app)
            .post("/v2/template/create")
            .send(createTemplateFixtures.VALID_TEMPLATE)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.params.should.have.property("resmsgid");
                res.body.result.template_id.should.be.eq("json11template")
                res.body.result.message.should.be.eq("The query template has been saved successfully")
                done();
            });
    })

    it("Create template Failure: Request body validation", (done) => {
        chai
            .request(app)
            .post("/v2/template/create")
            .send(createTemplateFixtures.INVALID_TEMPLATE)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.params.should.have.property("resmsgid");
                res.body.error.message.should.be.eq("#required should have required property 'id'");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_INVALID_INPUT")
                done();
            });
    })

    it("Create template Failure: Invalid name", (done) => {
        chai
            .request(app)
            .post("/v2/template/create")
            .send(createTemplateFixtures.INVALID_NAME)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.params.should.have.property("resmsgid");
                res.body.error.message.should.be.eq("Template name should contain alphanumeric characters and single space between characters");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_INVALID_INPUT")
                done();
            });
    })

    it("Create template Failure: Required variables not exists", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.resolve(null)
        })
        chai
            .request(app)
            .post("/v2/template/create")
            .send(createTemplateFixtures.REQUIRED_VARIABLES_NOT_EXISTS)
            .end((err, res) => {
                console.log(res)
                res.should.have.status(400);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.params.should.have.property("resmsgid");
                res.body.error.message.should.be.eq("Invalid template provided, A template should consist of variables DATASET,STARTDATE,ENDDATE and type of json,sql");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_INVALID_INPUT")
                done();
            });
    })

    it("Create template Failure: Template already exists", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.resolve({ dataValues: { template_id: "json11template" } })
        })
        chai
            .request(app)
            .post("/v2/template/create")
            .send(createTemplateFixtures.VALID_TEMPLATE)
            .end((err, res) => {
                res.should.have.status(409);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.responseCode.should.be.eq("CONFLICT");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.params.should.have.property("resmsgid");
                res.body.error.message.should.be.eq("Template json11template already exists");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_ALREADY_EXISTS")
                done();
            });
    })

    it("Create template Failure: Database connection failure", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.reject({})
        })
        chai
            .request(app)
            .post("/v2/template/create")
            .send(createTemplateFixtures.VALID_TEMPLATE)
            .end((err, res) => {
                res.should.have.status(500);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.responseCode.should.be.eq("INTERNAL_SERVER_ERROR");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.params.should.have.property("resmsgid");
                res.body.error.message.should.be.eq("Failed to create query template");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_CREATION_FAILED")
                done();
            });
    })
})