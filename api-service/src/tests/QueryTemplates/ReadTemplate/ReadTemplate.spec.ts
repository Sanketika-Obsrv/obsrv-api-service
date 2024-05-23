import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import { describe, it } from 'mocha';
import _ from "lodash";
import { QueryTemplate } from "../../../models/QueryTemplate";
const apiId = 'api.query.template.read'

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("READ QUERY TEMPLATE API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Read template success: Read template successful", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.resolve({
                dataValues: {
                    template_id: 'sql1',
                    template_name: 'sql1',
                    query: '"SELECT * FROM {{DATASET}} WHERE __time BETWEEN TIMESTAMP {{STARTDATE}} AND TIMESTAMP {{ENDDATE}} LIMIT 1"',
                    query_type: 'sql',
                    created_by: 'SYSTEM',
                    updated_by: 'SYSTEM',
                    created_date: "2024-04-29T11:29:58.759Z",
                    updated_date: "2024-04-29T11:29:58.759Z"
                }
            })
        })

        chai
            .request(app)
            .get("/v2/template/read/sql1")
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.params.status.should.be.eq("SUCCESS");
                res.body.responseCode.should.be.eq("OK");
                res.body.result.template_id.should.be.eq("sql1");
                done();
            });
    })

    it("Read template failure: Requested template does not exists", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.resolve(null)
        })

        chai
            .request(app)
            .get("/v2/template/read/template")
            .end((err, res) => {
                res.should.have.status(404);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.responseCode.should.be.eq("NOT_FOUND");
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("Template template does not exists");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_NOT_EXISTS")
                done();
            });
    })

    it("Read template failure: Database connection error", (done) => {
        chai.spy.on(QueryTemplate, "findOne", () => {
            return Promise.reject()
        })

        chai
            .request(app)
            .get("/v2/template/read/template")
            .end((err, res) => {
                res.should.have.status(500);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.should.have.property("resmsgid");
                res.body.responseCode.should.be.eq("INTERNAL_SERVER_ERROR");
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("Failed to read query template");
                res.body.error.code.should.be.eq("QUERY_TEMPLATE_READ_FAILED")
                done();
            });
    })
})