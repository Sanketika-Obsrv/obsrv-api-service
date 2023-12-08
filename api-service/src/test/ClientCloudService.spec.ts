import app from "../app";
import chai from "chai";
import chaiHttp from "chai-http";
import httpStatus from "http-status";
import { TestExhaust } from "./Fixtures";
import { config } from "./Config";
import constants from "../resources/Constants.json";
import { dbConnector, globalCache, exhaustService } from "../routes/Router";
import chaiSpies from 'chai-spies'
import { describe, it } from 'mocha';
import { config as appConfig } from "../configs/Config";
import moment from "moment";
import { DatasetStatus } from "../models/DatasetModels";
chai.use(chaiSpies)
chai.should();
chai.use(chaiHttp);

describe("AWS Cloud Storage", () => {
    beforeEach(() => {
        chai.spy.on(globalCache, "get", () => {
            return [{ "id": ":datasetId", "dataset_id": ":datasetId", "status": DatasetStatus.Live, "dataset_config": { "entry_topic": "topic" } }]
        })
    })

    afterEach(() => {
        chai.spy.restore()
    })

    it("it should return 404 if dataset record not found", (done) => {
        chai.spy.restore()
        chai.spy.on(dbConnector, "listRecords", () => {
            return Promise.resolve([{}])
        })
        chai.spy.on(globalCache, "get", () => {
            return []
        })
        chai
            .request(app)
            .get(config.apiExhaustEndPoint)
            .query(TestExhaust.VALID_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND)
                res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                res.body.result.should.be.a("object")
                res.body.responseCode.should.be.eq(httpStatus["404_NAME"])
                done()
            })
    });

    it("it should raise error when from or to have invalid dates", (done) => {
        chai
            .request(app)
            .get(config.apiExhaustEndPoint)
            .query(TestExhaust.INVALID_DATE_RANGE)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST)
                res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                res.body.result.should.be.a("object")
                res.body.responseCode.should.be.eq(httpStatus["400_NAME"])
                done()
            })
    });

    it("it should raise error when time interval is greater than 31 days", (done) => {
        chai
            .request(app)
            .get(config.apiExhaustEndPoint)
            .query(TestExhaust.DATE_RANGE_OVER_LIMIT)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST)
                res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                res.body.params.errmsg.should.be.eq(constants.ERROR_MESSAGE.INVALID_DATE_RANGE.replace("${allowedRange}", `${config.exhaustMaxDateRange}`))
                res.body.result.should.be.a("object")
                res.body.responseCode.should.be.eq(httpStatus["400_NAME"])
                done()
            })
    });

    it("it should return 404 when no files exist for given date range", (done) => {
        chai.spy.on(exhaustService, "getFromStorage", () => {
            return Promise.resolve({
                expiresAt: moment().add(appConfig.exhaust_config.storage_url_expiry, "seconds").toISOString(),
                files: [],
                periodWiseFiles: {},
            });
        })
        chai
            .request(app)
            .get(config.apiExhaustEndPoint)
            .query(TestExhaust.VALID_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND)
                res.body.params.status.should.be.eq(constants.STATUS.FAILURE)
                res.body.result.should.be.a("object")
                res.body.params.errmsg.should.be.eq(constants.EXHAUST.NO_BACKUP_FILES)
                res.body.responseCode.should.be.eq(httpStatus["404_NAME"])
                done()
            })
    });

    it("it should return data for a valid request", (done) => {
        const timestamp = moment().add(config.storage_url_expiry, "seconds").toISOString()
        const periodWiseData = {
            "2023-06-15": ["file1", "file2"],
        };
        chai.spy.on(exhaustService, "getFromStorage", () => {
            return Promise.resolve({
                expiresAt: timestamp,
                files: ["file1", "file2"],
                periodWiseFiles: periodWiseData,
            });
        })
        chai
            .request(app)
            .get(config.apiExhaustEndPoint)
            .query(TestExhaust.VALID_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK)
                res.body.params.status.should.be.eq(constants.STATUS.SUCCESS)
                res.body.result.should.be.a("object")
                res.body.result.expiresAt.should.be.eq(timestamp)
                res.body.result.files.should.have.length(2)
                res.body.result.periodWiseFiles.should.be.eql(periodWiseData)
                res.body.responseCode.should.be.eq(httpStatus["200_NAME"])
                done()
            })
    });
})
