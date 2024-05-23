import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import { describe, it } from 'mocha';
import _ from "lodash";
import { updateTemplateFixtures } from "./Fixtures"
import { QueryTemplate } from "../../../models/QueryTemplate";
const apiId = 'api.query.template.update'
const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6d";
chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("UPDATE QUERY TEMPLATE API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Update template success: should update query template", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.resolve({ dataValues: { template_id: "sql11template1" } })
        })
        chai.spy.on(QueryTemplate, "update", () => {
            return Promise.resolve({ dataValues: { template_id: "sql11template1", message: "Query template updated successfully" } })
        })

        chai
            .request(app)
            .patch("/v2/template/update/sql11template1")
            .send(updateTemplateFixtures.VALID_REQUEST_BODY)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.templateId.should.be.eq("sql11template1")
                res.body.result.message.should.be.eq("Query template updated successfully")
                done();
            });
    })

    it("Update template failure: query key should present in request body", (done) => {
        chai
            .request(app)
            .patch("/v2/template/update/sql11template1")
            .send(updateTemplateFixtures.SHOULD_HAVE_QUERY)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.params.status.should.be.eq("FAILED")
                res.body.responseCode.should.be.eq("BAD_REQUEST")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("#properties/request/dependencies should have property query when property query_type is present")
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_INVALID_INPUT")
                done();
            });
    })

    it("Update template failure: Invalid name given", (done) => {
        chai
            .request(app)
            .patch("/v2/template/update/sql11template1")
            .send(updateTemplateFixtures.INVALID_NAME)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.params.status.should.be.eq("FAILED")
                res.body.responseCode.should.be.eq("BAD_REQUEST")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Template name should contain alphanumeric characters and single space between characters")
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_INVALID_INPUT")
                done();
            });
    })

    it("Update template Failure: Template not exists", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.resolve(null)
        })
        chai
            .request(app)
            .patch("/v2/template/update/sql11template1")
            .send(updateTemplateFixtures.REQUIRED_VARIABLES_NOT_EXISTS)
            .end((err, res) => {
                res.should.have.status(404);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.responseCode.should.be.eq("NOT_FOUND");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Template sql11template1 does not exists");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_NOT_EXISTS")
                done();
            });
    })

    it("Update template Failure: Required variables not exists", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.resolve({ dataValues: { template_id: "sql11template1" } })
        })
        chai
            .request(app)
            .patch("/v2/template/update/sql11template1")
            .send(updateTemplateFixtures.REQUIRED_VARIABLES_NOT_EXISTS)
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.responseCode.should.be.eq("BAD_REQUEST");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Invalid template provided, A template should consist of variables DATASET,STARTDATE,ENDDATE and type of json,sql");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_INVALID_INPUT")
                done();
            });
    })

    it("Update template Failure: Database connection error", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.reject()
        })
        chai
            .request(app)
            .patch("/v2/template/update/sql11template1")
            .send(updateTemplateFixtures.REQUIRED_VARIABLES_NOT_EXISTS)
            .end((err, res) => {
                res.should.have.status(500);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.responseCode.should.be.eq("INTERNAL_SERVER_ERROR");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.error.message.should.be.eq("Failed to update query template");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_UPDATE_FAILED")
                done();
            });
    })
})