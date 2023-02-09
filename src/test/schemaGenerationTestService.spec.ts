import app from "../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { TestDatasetSchemaGeneration, TestIngestionSchema } from "./fixtures";
import { config } from "./config";
import routes from "../routes/routesConfig";

chai.use(spies);
chai.should();
chai.use(chaiHttp);


describe("DATASET SCHEMA GENERATE API", () => {
    it("should successfully create ingestion spec when given simple json", (done) => {
        chai
            .request(app)
            .post(config.apiDatasetSchemaGenerateEndPoint)
            .send(TestDatasetSchemaGeneration.SIMPLE_JSON_INPUT)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                res.body.id.should.be.eq(routes.SCHEMA.DATASET_SCHEMA.API_ID);
                done();
            });
    })
    it("should successfully create ingestion spec when given nested json is given", (done) => {
        chai
            .request(app)
            .post(config.apiDatasetSchemaGenerateEndPoint)
            .send(TestDatasetSchemaGeneration.NESTED_JSON_INPUT)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                res.body.id.should.be.eq(routes.SCHEMA.DATASET_SCHEMA.API_ID);
                done();
            });
    })
    it("should not create ingestion spec when there are duplicate entries", (done) => {
        done()
    })
    it("should not create ingestion spec for empty fields", (done) => {
        done()
    })
})

describe("INGESTION SCHEMA GENERATE API", () => {
    it("should successfully create ingestion spec when given simple json", (done) => {
        chai
            .request(app)
            .post(config.apiIngestionSchemaGenerateEndPoint)
            .send(TestIngestionSchema.SIMPLE_JSON_INPUT)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                res.body.id.should.be.eq(routes.SCHEMA.INGESTION_SCHEMA.API_ID);
                done();
            });
    })
    it("should successfully create ingestion spec when given nested json is given", (done) => {
        chai
            .request(app)
            .post(config.apiIngestionSchemaGenerateEndPoint)
            .send(TestIngestionSchema.NESTED_JSON_INPUT)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                res.body.id.should.be.eq(routes.SCHEMA.INGESTION_SCHEMA.API_ID);
                done();
            });
    })
    it("should not create ingestion spec when there are duplicate entries", (done) => {
        done()
    })
    it("should not create ingestion spec for empty fields", (done) => {
        done()
    })
})


