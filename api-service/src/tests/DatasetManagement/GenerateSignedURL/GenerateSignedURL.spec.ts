import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from 'mocha';
import _ from "lodash";
import { apiId, code } from "../../../controllers/GenerateSignedURL/GenerateSignedURL";
import { TestInputsForGenerateURL } from "./Fixtures";
import { cloudProvider } from "../../../services/CloudServices";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6d"
const path= "/v2/files/generate-url"
describe("FILES GENERATE-URL API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("Files sample url generated successfully to download with more than one file", (done) => {
        chai.spy.on(cloudProvider, "generateSignedURLs", (container, fileList) => {
            const signedUrlPromise = _.map(fileList, (file: any) => {
                return new Promise(resolve => {
                    const fileName: any = _.split(file, "/").pop()
                    resolve({ [fileName]: `https://obsrv-data.s3.ap-south-1.amazonaws.com/container/api-service/user-upload/${fileName}?X-Amz-Algorithm=AWS4-HMAC` });
                });
            });
            return signedUrlPromise;
        });
        chai
            .request(app)
            .post(path)
            .send(TestInputsForGenerateURL.VALID_REQUEST_SCHEMA_WITH_MORE_THAN_ONE_FILE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.should.be.a("array")
                const result = JSON.stringify(res.body.result)
                expect(result).to.match(/^\[{"filePath":(.+)"fileName":"telemetry.json"(.+)"preSignedUrl":"https:\/\/obsrv-data.s3.ap-south-1.amazonaws.com(.+)$/)
                done();
            });
    });

    it("Files sample url generated successfully to upload with one file", (done) => {
        chai.spy.on(cloudProvider, "generateSignedURLs", (container, fileList) => {
            const signedUrlPromise = _.map(fileList, (file: any) => {
                return new Promise(resolve => {
                    const fileName: any = _.split(file, "/").pop()
                    resolve({ [fileName]: `https://obsrv-data.s3.ap-south-1.amazonaws.com/container/api-service/user-upload/${fileName}?X-Amz-Algorithm=AWS4-HMAC` });
                });
            });
            return signedUrlPromise;
        });
        chai
            .request(app)
            .post(path)
            .send(TestInputsForGenerateURL.VALID_REQUEST_SCHEMA_WITH_ONE_FILE)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.params.msgid.should.be.eq(msgid)
                res.body.result.should.be.a("array")
                const result = JSON.stringify(res.body.result)
                expect(result).to.match(/^\[{"filePath":(.+)"fileName":"telemetry.json"(.+)"preSignedUrl":"https:\/\/obsrv-data.s3.ap-south-1.amazonaws.com(.+)$/)
                done();
            });
    });

    it("Files sample generate url failure: When limit for the number of url generation exceeded", (done) => {
        chai
            .request(app)
            .post(path)
            .send(TestInputsForGenerateURL.REQUEST_SCHEMA_WITH_EXCEEDED_FILES)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq("FILES_URL_GENERATION_LIMIT_EXCEED")
                res.body.error.message.should.be.eq("Pre-signed URL generation failed: limit exceeded.")
                done();
            });
    });

    it("Files sample generate url failure: Invalid request payload provided", (done) => {
        chai
            .request(app)
            .post(path)
            .send(TestInputsForGenerateURL.INVALID_REQUEST_SCHEMA)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq("FILES_GENERATE_URL_INPUT_INVALID")
                expect(res.body.error.message).to.match(/^(.+) should be array$/)
                done();
            });
    });

    it("Files sample generate url failure: Connection to the cloud provider failed", (done) => {
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
            .post(path)
            .send(TestInputsForGenerateURL.VALID_REQUEST_SCHEMA_WITH_ONE_FILE)
            .end((err, res) => {
                res.should.have.status(httpStatus.INTERNAL_SERVER_ERROR);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq(code)
                res.body.error.message.should.be.eq("Failed to generate sample urls")
                done();
            });
    });
})