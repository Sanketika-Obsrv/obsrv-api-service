import app from "../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { TestDatasetSchema } from "./fixtures";
import { config } from "./config";
import routes from "../routes/routesConfig";
import { postgresConnector } from "../routes/router";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("CREATE API", () => {

    it("it should not save schema if service is down", (done) => {
        chai.spy.on(postgresConnector.pool, "query", () => {
            return Promise.reject(new Error("error connecting postgres"))
        })
        chai
            .request(app)
            .post(config.apiSchemaSaveEndPoint)
            .send(TestDatasetSchema.SAMPLE_INPUT)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.responseCode.should.be.eq(httpStatus["500_NAME"]);
                res.body.id.should.be.eq(routes.SCHEMA_OPERATIONS.SAVE.API_ID);
                chai.spy.restore(postgresConnector.pool, "query");
                done();
            });
    });
    it("it should save schema successfully", (done) => {
        chai.spy.on(postgresConnector.pool, "query", () => {
            return Promise.resolve()
        })
        chai
            .request(app)
            .post(config.apiSchemaSaveEndPoint)
            .send(TestDatasetSchema.SAMPLE_INPUT)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routes.SCHEMA_OPERATIONS.SAVE.API_ID);
                chai.spy.restore(postgresConnector.pool, "query");
                done();
            });
    });
    it("it should not save schema if required fields are missing", (done) => {
        chai
            .request(app)
            .post(config.apiSchemaSaveEndPoint)
            .send(TestDatasetSchema.MISSING_FIELDS)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routes.SCHEMA_OPERATIONS.SAVE.API_ID);
                done();
            });
    });
    it("it should not save schema if fields are given in incorrect format", (done) => {
        chai
            .request(app)
            .post(config.apiSchemaSaveEndPoint)
            .send(TestDatasetSchema.INCORRECT_FIELD_FORMAT)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routes.SCHEMA_OPERATIONS.SAVE.API_ID);
                done();
            });
    });
})

describe("READ API", () => {
    it("should return schema when requested", (done) => {
        chai.spy.on(postgresConnector.pool, "query", ()=>{
            return Promise.resolve({rows:[]})
        })
        chai
            .request(app)
            .get(config.apiSchemaReadEndPoint)
            .query({ dataset_id: "telemetry-raw" })
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routes.SCHEMA_OPERATIONS.READ.API_ID);
                chai.spy.restore(postgresConnector.pool, "query");
                done();
            })
    })
    it("should not return schema when requested", (done) => {
        chai.spy.on(postgresConnector.pool, "query", ()=>{
            return Promise.reject(new Error("relation does not exists"))
        })
        chai
            .request(app)
            .get(config.apiSchemaReadEndPoint)
            .query({ dataset_id: "telemetry-raw" })
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus["500_NAME"]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routes.SCHEMA_OPERATIONS.READ.API_ID);
                chai.spy.restore(postgresConnector.pool, "query");
                done();
            })
    })
})