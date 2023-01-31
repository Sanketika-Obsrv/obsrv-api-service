import app from "../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { TestDataset } from "./fixtures";
import { config } from "./config";
import routes from "../routes/routesConfig";
import { datasetService, kafkaConnector } from "../routes/router";

chai.use(spies);
chai.should();
chai.use(chaiHttp);


describe("CREATE API", () => {
    it("it should not ingest data if service is down", (done) => {
        chai.spy.on(kafkaConnector, "execute", () => {
            return Promise.reject(new Error("error connecting kafka"))
        })
        chai
            .request(app)
            .post(config.apiCreateDatasetEndPoint)
            .send(JSON.parse(TestDataset.SAMPLE_INPUT_FORMAT))
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.responseCode.should.be.eq(httpStatus["500_NAME"]);
                chai.spy.restore(kafkaConnector, "execute")
                done();
            });
    });
    it("it should ingest data successfully", (done) => {
        chai.spy.on(kafkaConnector, "execute", () => {
            return Promise.resolve("data ingested")
        })
        chai
            .request(app)
            .post(config.apiCreateDatasetEndPoint)
            .send(JSON.parse(TestDataset.SAMPLE_INPUT_FORMAT))
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routes.DATASET.CREATE.API_ID);
                chai.spy.restore(kafkaConnector, "execute")
                done();
            });
    });
    it("it should not ingest data if data is in incorrect format", (done) => {
        chai
            .request(app)
            .post(config.apiCreateDatasetEndPoint)
            .send(TestDataset.SAMPLE_INPUT_FORMAT)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus["500_NAME"]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routes.DATASET.CREATE.API_ID);
                done();
            });
    });
    it("failure assertion on kafka connect", (done) => {
        chai.spy.on(kafkaConnector, "connect", () => {
            return Promise.reject(new Error("error connecting kafka"))
        })
        datasetService.init()
        chai.expect(kafkaConnector.connect).to.be.called
        chai.spy.restore(kafkaConnector, "connect")
        done()
    });
    it("success assertion on kafka connect", (done) => {
        chai.spy.on(kafkaConnector, "connect", () => {
            return Promise.resolve()
        })
        datasetService.init()
        chai.expect(kafkaConnector.connect).to.be.called
        chai.spy.restore(kafkaConnector, "connect")
        done()
    });
})