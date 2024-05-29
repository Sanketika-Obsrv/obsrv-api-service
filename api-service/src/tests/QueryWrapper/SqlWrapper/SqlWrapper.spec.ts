import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import { describe, it } from 'mocha';
import _ from "lodash";
import { TestInputsForSqlWrapper } from "./Fixtures";
import { druidHttpService } from "../../../controllers/QueryWrapper/SqlQueryWrapper";
import httpStatus from "http-status";

const apiId = "api.obsrv.data.sql-query";
chai.use(spies);
chai.should();
chai.use(chaiHttp);

const path = "/v2/obsrv/data/sql-query"

describe("SQL QUERY WRAPPER API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Sql query wrapper success: Should return response on query successfully", (done) => {
        chai.spy.on(druidHttpService, "post", () => {
            return Promise.resolve(TestInputsForSqlWrapper.SUCCESS_REPONSE)
        })
        chai
            .request(app)
            .post(path)
            .send(TestInputsForSqlWrapper.VALID_QUERY)
            .end((err, res) => {
                res.should.have.status(200);
                const dataCount = _.size(res.body)
                dataCount.should.be.eq(4)
                const result = JSON.stringify(res.body)
                result.should.be.eq(JSON.stringify(TestInputsForSqlWrapper.SUCCESS_REPONSE.data))
                done();
            });
    })

    it("Sql query wrapper failure: Empty request body provided", (done) => {
        chai
            .request(app)
            .post(path)
            .send({})
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("Failed to query. Invalid request")
                res.body.error.code.should.be.eq("SQL_QUERY_EMPTY_REQUEST")
                done();
            });
    })

    it("Sql query wrapper failure: Invalid query provided", (done) => {
        chai.spy.on(druidHttpService, "post", () => {
            return Promise.reject({ message: "Request failed with status code 500" })
        })
        chai
            .request(app)
            .post(path)
            .send(TestInputsForSqlWrapper.INVALID_QUERY)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq("SQL_QUERY_FAILURE")
                res.body.error.message.should.be.eq("Request failed with status code 500")
                done();
            });
    })

    it("Sql query wrapper failure: Failed to connect to druid", (done) => {
        chai.spy.on(druidHttpService, "post", () => {
            return Promise.reject()
        })
        chai
            .request(app)
            .post(path)
            .send(TestInputsForSqlWrapper.INVALID_QUERY)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq("SQL_QUERY_FAILURE")
                res.body.error.message.should.be.eq("Failed to query to druid")
                done();
            });
    })
})