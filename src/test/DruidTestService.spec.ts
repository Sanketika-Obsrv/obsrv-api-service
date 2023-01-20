import app from "../app";
import chai from "chai";
import chaiHttp from "chai-http";
import nock from "nock";
import httpStatus from "http-status";
import TestDruidQuery from "./testquery";
import { config } from "./config";
import constants from "../resources/constants.json";
import routes from "../routes/routesConfig";
chai.should();
chai.use(chaiHttp);

describe("druid API", () => {
  describe("If druid service is down", () => {
    it("it should raise error when native query endpoint is called", (done) => {
      chai
        .request(app)
        .post(config.apiDruidEndPoint)
        .send(JSON.parse(TestDruidQuery.VALID_QUERY))
        .end((err, res) => {
          res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
          res.body.responseCode.should.be.eq(httpStatus["500_NAME"]);
          done();
        });
    });
    it("should raise error when sql query endpoint is called", (done) => {
      chai
        .request(app)
        .post(config.apiDruidSqlEndPoint)
        .send(JSON.parse(TestDruidQuery.VALID_SQL_QUERY))
        .end((err, res) => {
          res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
          res.body.responseCode.should.be.eq(httpStatus["500_NAME"]);
          done();
        });
    });
  });
  describe("POST /query/v2/native-query", () => {
    beforeEach(() => {
      nock(config.druidHost + ":" + config.druidPort)
        .post(config.druidEndPoint)
        .reply(200, [{ events: [] }]);
    });
    it("it should fetch information from druid data source", (done) => {
      chai
        .request(app)
        .post(config.apiDruidEndPoint)
        .send(JSON.parse(TestDruidQuery.VALID_QUERY))
        .end((err, res) => {
          res.should.have.status(httpStatus.OK);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
          res.body.should.have.property("result");
          res.body.result.length.should.be.lessThan(101);
          res.body.id.should.be.eq(routes.QUERY.NATIVE_QUERY.API_ID);
          done();
        });
    });
    it("it should reject query, when datarange given as list is higher than limit", (done) => {
      chai
        .request(app)
        .post(config.apiDruidEndPoint)
        .send(JSON.parse(TestDruidQuery.HIGH_DATE_RANGE_GIVEN_AS_LIST))
        .end((err, res) => {
          res.should.have.status(httpStatus.BAD_REQUEST);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
          res.body.params.status.should.be.eq(httpStatus[400]);
          res.body.result.should.be.empty;
          res.body.id.should.be.eq(routes.QUERY.NATIVE_QUERY.API_ID);
          done();
        });
    });
    it("it should reject query, when datarange given as string is higher than limit", (done) => {
      chai
        .request(app)
        .post(config.apiDruidEndPoint)
        .send(JSON.parse(TestDruidQuery.HIGH_DATE_RANGE_GIVEN_AS_STRING))
        .end((err, res) => {
          res.should.have.status(httpStatus.BAD_REQUEST);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
          res.body.params.status.should.be.eq(httpStatus[400]);
          res.body.result.should.be.empty;
          res.body.id.should.be.eq(routes.QUERY.NATIVE_QUERY.API_ID);
          done();
        });
    });
    it("it should set threshold to default when given threshold is higher than limit", (done) => {
      chai
        .request(app)
        .post(config.apiDruidEndPoint)
        .send(JSON.parse(TestDruidQuery.HIGH_THRESHOLD_QUERY)) // given threshold is 1K
        .end((err, res) => {
          res.should.have.status(httpStatus.OK);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
          res.body.result.length.should.be.lessThan(101); // default is 100
          res.body.id.should.be.eq(routes.QUERY.NATIVE_QUERY.API_ID);
          done();
        });
    });
    it("it should set row_limit to default when given row_limit is higher than limit", (done) => {
      chai
        .request(app)
        .post(config.apiDruidEndPoint)
        .send(JSON.parse(TestDruidQuery.HIGH_LIMIT_QUERY)) // given row_limit is 1K
        .end((err, res) => {
          res.should.have.status(httpStatus.OK);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
          res.body.result.length.should.be.lessThan(101); // default is 100
          res.body.id.should.be.eq(routes.QUERY.NATIVE_QUERY.API_ID);
          done();
        });
    });
    it("it should set threshold to default when threshold is not given", (done) => {
      chai
        .request(app)
        .post(config.apiDruidEndPoint)
        .send(JSON.parse(TestDruidQuery.WITHOUT_THRESOLD_QUERY))
        .end((err, res) => {
          res.should.have.status(httpStatus.OK);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
          res.body.result.length.should.be.lessThan(101); // default is 100
          res.body.id.should.be.eq(routes.QUERY.NATIVE_QUERY.API_ID);
          done();
        });
    });
    it("it should reject query when date range is not given", (done) => {
      chai
        .request(app)
        .post(config.apiDruidEndPoint)
        .send(JSON.parse(TestDruidQuery.WITHOUT_DATE_RANGE_QUERY))
        .end((err, res) => {
          res.should.have.status(httpStatus.BAD_REQUEST);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
          res.body.params.status.should.be.eq(httpStatus[400]);
          res.body.result.should.be.empty;
          res.body.id.should.be.eq(routes.QUERY.NATIVE_QUERY.API_ID);
          done();
        });
    });
    // // todo
    it("it should reject query when query limits are not found for particular datasource", (done) => {
      chai
        .request(app)
        .post(config.apiDruidEndPoint)
        .send(JSON.parse(TestDruidQuery.UNSUPPORTED_DATA_SOURCE))
        .end((err, res) => {
          res.should.have.status(httpStatus.BAD_REQUEST);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
          res.body.params.status.should.be.eq(httpStatus[400]);
          res.body.result.should.be.empty;
          res.body.id.should.be.eq(routes.QUERY.NATIVE_QUERY.API_ID);
          done();
        });
    });
    it("it should reject query when querytype is invalid", (done) => {
      chai
        .request(app)
        .post(config.apiDruidEndPoint)
        .send(JSON.parse(TestDruidQuery.INVALID_QUERY_TYPE))
        .end((err, res) => {
          res.should.have.status(httpStatus.BAD_REQUEST);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
          res.body.params.status.should.be.eq(httpStatus[400]);
          res.body.result.should.be.empty;
          res.body.id.should.be.eq(routes.QUERY.NATIVE_QUERY.API_ID);
          done();
        });
    });
    it("it should reject query with unsupported schema", (done) => {
      chai
        .request(app)
        .post(config.apiDruidEndPoint)
        .send(JSON.parse(TestDruidQuery.UNSUPPORTED_SCHEMA))
        .end((err, res) => {
          res.should.have.status(httpStatus.BAD_REQUEST);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
          res.body.params.status.should.be.eq(httpStatus[400]);
          res.body.result.should.be.empty;
          res.body.id.should.be.eq(routes.QUERY.NATIVE_QUERY.API_ID);
          done();
        });
    });
    it("it should reject the query because of incorrect url", (done) => {
      chai
        .request(app)
        .get("/invalid/endpoint")
        .end((err, res) => {
          res.should.have.status(httpStatus.NOT_FOUND);
          res.body.should.be.a("object");
          res.body.id.should.be.eq(routes.API_ID);
          res.body.responseCode.should.be.eq(httpStatus["404_NAME"]);
          res.body.params.status.should.be.eq(httpStatus[400]);
          res.body.result.should.be.empty;
          done();
        });
    });
  });
  describe("POST /druid/v2/sql", () => {
    beforeEach(() => {
      nock(config.druidHost + ":" + config.druidPort)
        .post(config.druidSqlEndPoint)
        .reply(200);
    });
    it("it should allow druid to query when a valid sql query is given", (done) => {
      chai
        .request(app)
        .post(config.apiDruidSqlEndPoint)
        .send(JSON.parse(TestDruidQuery.VALID_SQL_QUERY))
        .end((err, res) => {
          res.should.have.status(httpStatus.OK);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
          res.body.result.length.should.be.lessThan(101);
          res.body.id.should.be.eq(routes.QUERY.SQL_QUERY.API_ID);
          done();
        });
    });
    it("it should update row_limit to default when row_limit is higher than limit", (done) => {
      chai
        .request(app)
        .post(config.apiDruidSqlEndPoint)
        .send(JSON.parse(TestDruidQuery.HIGH_LIMIT_SQL_QUERY)) // given row_limit is 1K
        .end((err, res) => {
          res.should.have.status(httpStatus.OK);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
          res.body.result.length.should.be.lessThan(101); // default is 100
          res.body.id.should.be.eq(routes.QUERY.SQL_QUERY.API_ID);
          done();
        });
    });
    it("it should set row_limit to default when none is given", (done) => {
      chai
        .request(app)
        .post(config.apiDruidSqlEndPoint)
        .send(JSON.parse(TestDruidQuery.WITHOUT_LIMIT_SQL_QUERY))
        .end((err, res) => {
          res.should.have.status(httpStatus.OK);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
          res.body.result.length.should.be.lessThan(101); // default is 100
          res.body.id.should.be.eq(routes.QUERY.SQL_QUERY.API_ID);
          done();
        });
    });
    it("it should reject the query when daterange range is higher than limit", (done) => {
      chai
        .request(app)
        .post(config.apiDruidSqlEndPoint)
        .send(JSON.parse(TestDruidQuery.HIGH_DATE_RANGE_SQL_QUERY))
        .end((err, res) => {
          res.should.have.status(httpStatus.BAD_REQUEST);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
          res.body.params.status.should.be.eq(httpStatus[400]);
          res.body.result.should.be.empty;
          res.body.id.should.be.eq(routes.QUERY.SQL_QUERY.API_ID);
          done();
        });
    });
    it("it should reject the query when no daterange is given", (done) => {
      chai
        .request(app)
        .post(config.apiDruidSqlEndPoint)
        .send(JSON.parse(TestDruidQuery.WITHOUT_DATE_RANGE_SQL_QUERY))
        .end((err, res) => {
          res.should.have.status(httpStatus.BAD_REQUEST);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
          res.body.params.status.should.be.eq(httpStatus[400]);
          res.body.result.should.be.empty;
          res.body.id.should.be.eq(routes.QUERY.SQL_QUERY.API_ID);
          done();
        });
    });
    it("it should reject query when invalid datasource is given", (done) => {
      chai
        .request(app)
        .post(config.apiDruidSqlEndPoint)
        .send(JSON.parse(TestDruidQuery.UNSUPPORTED_DATASOURCE_SQL_QUERY))
        .end((err, res) => {
          res.should.have.status(httpStatus.BAD_REQUEST);
          res.body.should.be.a("object");
          res.body.responseCode.should.be.eq(httpStatus["400_NAME"]);
          res.body.params.status.should.be.eq(httpStatus[400]);
          res.body.result.should.be.empty;
          res.body.id.should.be.eq(routes.QUERY.SQL_QUERY.API_ID);
          done();
        });
    });
  });
});
