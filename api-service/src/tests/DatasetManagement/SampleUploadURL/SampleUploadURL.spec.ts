import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import _ from "lodash";
import { apiId, errorCode } from "../../../controllers/SampleUploadURL/SampleUploadURL";
import { TestInputsForSampleUploadURL } from "./Fixtures";
import { cloudProvider } from "../../../services/CloudServices";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6d"

describe("DATASET SAMPLE UPLOAD-URL API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Dataset sample upload-url generated successfully with more than one file", (done) => {
        chai.spy.on(cloudProvider, "generateSignedURLs", (container, fileList) => {
            const signedUrlPromise = _.map(fileList, (file: any) => {
                return new Promise(resolve => {
                    resolve({ [file]: `https://obsrv-data.s3.ap-south-1.amazonaws.com/${file}?X-Amz-Algorithm=AWS4-HMAC` });
                });
            });
            return signedUrlPromise;
        });
        chai
            .request(app)
            .post("/v1/datasets/sample/upload-url")
            .send(TestInputsForSampleUploadURL.VALID_REQUEST_SCHEMA_WITH_MORE_THAN_ONE_FILE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.should.be.a("array")
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify([
                    {
                        "fileName": 'telemetry.json',
                        "preSignedUrl": 'https://obsrv-data.s3.ap-south-1.amazonaws.com/telemetry.json?X-Amz-Algorithm=AWS4-HMAC'
                    },
                    {
                        "fileName": 'school-data.json',
                        "preSignedUrl": 'https://obsrv-data.s3.ap-south-1.amazonaws.com/school-data.json?X-Amz-Algorithm=AWS4-HMAC'
                    }
                ]))
                done();
            });
    });

    it("Dataset sample upload-url generated successfully with one file", (done) => {
        chai.spy.on(cloudProvider, "generateSignedURLs", (container, fileList) => {
            const signedUrlPromise = _.map(fileList, (file: any) => {
                return new Promise(resolve => {
                    resolve({ 'telemetry.json': 'https://obsrv-data.s3.ap-south-1.amazonaws.com/telemetry.json?X-Amz-Algorithm=AWS4-HMAC' });
                });
            });
            return signedUrlPromise;
        });
        chai
            .request(app)
            .post("/v1/datasets/sample/upload-url")
            .send(TestInputsForSampleUploadURL.VALID_REQUEST_SCHEMA_WITH_ONE_FILE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.should.be.a("array")
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify([
                    {
                        "fileName": 'telemetry.json',
                        "preSignedUrl": 'https://obsrv-data.s3.ap-south-1.amazonaws.com/telemetry.json?X-Amz-Algorithm=AWS4-HMAC'
                    }
                ]))
                done();
            });
    });

    it("Dataset sample upload-url failure: No files provided to generate upload-url", (done) => {
        chai
            .request(app)
            .post("/v1/datasets/sample/upload-url")
            .send(TestInputsForSampleUploadURL.REQUEST_SCHEMA_NO_FILES_PROVIDED)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq("DATASET_FILES_NOT_PROVIDED")
                res.body.error.message.should.be.eq("No files are provided to generate upload urls")
                done();
            });
    });

    it("Dataset sample upload-url failure: Invalid request payload provided", (done) => {
        chai
            .request(app)
            .post("/v1/datasets/sample/upload-url")
            .send(TestInputsForSampleUploadURL.INVALID_REQUEST_SCHEMA)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq("DATASETS_UPLOAD_URL_INPUT_INVALID")
                expect(res.body.error.message).to.match(/^(.+) should be array$/)
                done();
            });
    });

    it("Dataset sample upload-url failure: Connection to the cloud provider failed", (done) => {
        chai.spy.on(cloudProvider, "generateSignedURLs", (container, fileList) => {
            const promises = fileList.map((file: any) => {
                return new Promise(reject => {
                    throw Error
                });
            });
            return promises;
        });
        chai
            .request(app)
            .post("/v1/datasets/sample/upload-url")
            .send(TestInputsForSampleUploadURL.VALID_REQUEST_SCHEMA_WITH_ONE_FILE)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq(errorCode)
                res.body.error.message.should.be.eq("Failed to generate sample upload-url")
                done();
            });
    });
})