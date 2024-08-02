import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from "mocha";
import { ConnectorRegistry } from "../../../models/ConnectorRegistry";
import { TestInputsForConnectorsRead } from "./Fixtures";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const apiId = "api.connectors.read"

describe("Connectors Read API", () => {
    afterEach(() => {
        chai.spy.restore();
    })

    it("Connector read success: When mode is not provided", (done) => {
        chai.spy.on(ConnectorRegistry, "findOne", () => {
            return Promise.resolve(TestInputsForConnectorsRead.LIVE_CONNECTORS)
        })
        chai
            .request(app)
            .get("/v2/connectors/read/postgres-connector-1.0.0")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify(TestInputsForConnectorsRead.LIVE_CONNECTORS))
                done();
            });
    });

    it("Connector read success: When valid id is given, but value of mode is not provided", (done) => {
        chai.spy.on(ConnectorRegistry, "findOne", () => {
            return Promise.resolve(TestInputsForConnectorsRead.LIVE_CONNECTORS)
        })
        chai
            .request(app)
            .get("/v2/connectors/read/postgres-connector-1.0.0?mode=")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify(TestInputsForConnectorsRead.LIVE_CONNECTORS))
                done();
            });
    });

    it("Connector read success: With mode=edit", (done) => {
        chai.spy.on(ConnectorRegistry, "findOne", () => {
            return Promise.resolve(TestInputsForConnectorsRead.DRAFT_CONNECTORS)
        })
        chai
            .request(app)
            .get("/v2/connectors/read/mssql-connector-2.0.0?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                const result = JSON.stringify(res.body.result)
                result.should.be.eq(JSON.stringify(TestInputsForConnectorsRead.DRAFT_CONNECTORS))
                done();
            });
    });

    it("Connector read failure: when the requested connector of the id is not found", (done) => {
        chai.spy.on(ConnectorRegistry, "findOne", () => {
            return Promise.resolve()
        })
        chai
            .request(app)
            .get("/v2/connectors/read/postgres-connector-1.0.0?mode=edit")
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("Connector not found: postgres-connector-1.0.0")
                res.body.error.code.should.be.eq("CONNECTOR_NOT_FOUND")
                res.should.have.status(httpStatus.NOT_FOUND);
                done();
            });
    })



    it("Connector read Failure: when invalid id provided", (done) => {
        chai.spy.on(ConnectorRegistry, "findOne", () => {
            return Promise.resolve()
        })
        chai
            .request(app)
            .get("/v2/connectors/read/postgres-conn")
            .end((err, res) => {
                res.should.have.status(httpStatus.NOT_FOUND);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.message.should.be.eq("Connector not found: postgres-conn")
                res.body.error.code.should.be.eq("CONNECTOR_NOT_FOUND")
                res.should.have.status(httpStatus.NOT_FOUND);
                done();
            });
    });
})
