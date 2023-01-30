import app from "../app";
import chai from "chai";
import chaiHttp from "chai-http";
import nock from "nock";
import httpStatus from "http-status";
import { TestDataset } from "./fixtures";
import { config } from "./config";
import constants from "../resources/constants.json";
import routes from "../routes/routesConfig";
chai.should();
chai.use(chaiHttp);

describe("CREATE API", () => {
    describe("If service is down", () => {
        it("it should raise error when endpoint is called", (done) => {
            chai
                .request(app)
                .post(config.apiCreateDatasetEndPoint)
                .send(JSON.parse(TestDataset.VALID_INPUT_FORMAT))
                .end((err, res) => {
                    res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                    res.body.responseCode.should.be.eq(httpStatus["500_NAME"]);
                    done();
                });
        });
    })
    describe("POST /data/v2/create", () => {
        beforeEach(() => {
            nock(config.kafkaHost + ":" + config.kafkaPort)
                .get('')
                .reply(200);
        });
        it("it should ingest data successfully", (done) => {
            chai
                .request(app)
                .post(config.apiCreateDatasetEndPoint)
                .send(JSON.parse(TestDataset.VALID_INPUT_FORMAT))
                .end((err, res) => {
                    console.log(res)
                    res.should.have.status(httpStatus.OK);
                    res.body.should.be.a("object");
                    res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
                    res.body.should.have.property("result");
                    res.body.id.should.be.eq(routes.DATASET.CREATE.API_ID);
                    done();
                });
        });
        it("it should throw error when topic does not exists in kafka", (done)=>{
            chai
            .request(app)
            .post(config.apiCreateDatasetEndPoint)
            .send(JSON.parse(TestDataset.VALID_INPUT_FORMAT))
            .end((err, res) => {
                console.log(res)
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object");
                res.body.responseCode.should.be.eq(httpStatus["500_NAME"]);
                res.body.should.have.property("result");
                res.body.id.should.be.eq(routes.DATASET.CREATE.API_ID);
                done();
            });
        })
    })
})