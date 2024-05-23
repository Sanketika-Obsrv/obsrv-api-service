import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import { describe, it } from 'mocha';
import _ from "lodash";
import { QueryTemplate } from "../../../models/QueryTemplate";
const apiId = 'api.query.template.delete'

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("DELETE QUERY TEMPLATE API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Delete template success: Read template successful", (done) => {
        chai.spy.on(QueryTemplate, "destroy", () => {
            return Promise.resolve({
                dataValues: {
                    template_id: 'sql1'
                }
            })
        })

        chai
            .request(app)
            .delete("/v2/template/delete/sql1")
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS");
                res.body.params.should.have.property("resmsgid");
                res.body.responseCode.should.be.eq("OK");
                res.body.result.message.should.be.eq("Template sql1 deleted successfully")
                done();
            });
    })

    it("Delete template failure: Requested template does not exists", (done) => {
        chai.spy.on(QueryTemplate, "destroy", () => {
            return Promise.resolve(0)
        })

        chai
            .request(app)
            .delete("/v2/template/delete/template")
            .end((err, res) => {
                res.should.have.status(404);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.responseCode.should.be.eq("NOT_FOUND");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.should.have.property("resmsgid");
                res.body.error.message.should.be.eq("Template template does not exists");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_NOT_EXISTS")
                done();
            });
    })

    it("Delete template failure: Database connection error", (done) => {
        chai.spy.on(QueryTemplate, "destroy", () => {
            return Promise.reject()
        })

        chai
            .request(app)
            .delete("/v2/template/delete/template")
            .end((err, res) => {
                res.should.have.status(500);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.responseCode.should.be.eq("INTERNAL_SERVER_ERROR");
                res.body.params.status.should.be.eq("FAILED")
                res.body.params.should.have.property("resmsgid");
                res.body.error.message.should.be.eq("Failed to delete query template");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_DELETE_FAILED")
                done();
            });
    })
})