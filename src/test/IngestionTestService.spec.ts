// import app from "../app";
// import chai from "chai";
// import chaiHttp from "chai-http";
// import httpStatus from "http-status";
// import { testIngestionSpec } from "./fixtures";
// import { config } from "./config";
// import constants from "../resources/constants.json";
// import routes from "../routes/routesConfig";

// chai.should();
// chai.use(chaiHttp);
// describe("ingestionAPI", ()=>{
//     describe("testing different scenarios", () => {
//         it("should generate ingestion spec when simple json is given", (done) => {
//           chai
//             .request(app)
//             .post(config.apiIngestionSpecEndPoint)
//             .send(testIngestionSpec.SAMPLE_1)
//             .end((err, res) => {
//               res.should.have.status(httpStatus.OK);
//               res.body.responseCode.should.be.eq(httpStatus["200_NAME"]);
//               done();
//             });
//         })
//     })
// })
