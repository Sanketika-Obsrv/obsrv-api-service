import app from "../../../app";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from "mocha";
import { TestInputsForConnectorsList } from "./Fixtures";
import { ConnectorRegistry } from "../../../models/ConnectorRegistry";
import { userService } from "../../../services/UserService";
import { config } from "../../../configs/Config";
import { buildRbacToken, NO_ACCESS_ROLE } from "../../helpers/rbacTestHelper";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

const apiId = "api.connectors.list"
const msgid = "4a7f14c3-d61e-4d4f-be78-181834eeff6d"


describe("Connector List Api", () => {
    afterEach(() => {
        chai.spy.restore();
        config.is_RBAC_enabled = "false";
    });

    it("Connectors list Success: With all the filters provided", (done) => {
        chai.spy.on(ConnectorRegistry, "findAll", () => {
            return Promise.resolve([TestInputsForConnectorsList.VALID_CONNECTORS_LIST])
        })
        chai 
            .request(app)
            .post("/v2/connectors/list")
            .send(TestInputsForConnectorsList.REQUEST_WITH_BOTH_FILTERS)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.count.should.be.eq(1)
                res.body.params.msgid.should.be.eq(msgid)
                const result = JSON.stringify(res.body.result.data)
                const expectedResult = JSON.stringify([TestInputsForConnectorsList.VALID_CONNECTORS_LIST])
                result.should.be.eq(expectedResult)
                done();
            });
    }) 

    it("Connectors list Success: Without filters", (done) => {
        chai.spy.on(ConnectorRegistry, "findAll", () => {
            return Promise.resolve([TestInputsForConnectorsList.VALID_CONNECTORS_LIST])
        })
        chai 
            .request(app)
            .post("/v2/connectors/list")
            .send(TestInputsForConnectorsList.REQUEST_WITHOUT_FILTERS)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.count.should.be.eq(1)
                res.body.params.msgid.should.be.eq(msgid)
                const result = JSON.stringify(res.body.result.data)
                const expectedResult = JSON.stringify([TestInputsForConnectorsList.VALID_CONNECTORS_LIST])
                result.should.be.eq(expectedResult)
                done();
            });
    })

    it("Connectors list Success: Filtered based on category", (done) => {
        chai.spy.on(ConnectorRegistry, "findAll", () => {
            return Promise.resolve([TestInputsForConnectorsList.VALID_CONNECTORS_LIST_CATEGORY])
        })
        chai 
            .request(app)
            .post("/v2/connectors/list")
            .send(TestInputsForConnectorsList.REQUEST_WITH_CATEGORY_FILTERS)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.count.should.be.eq(1)
                res.body.params.msgid.should.be.eq(msgid)
                const result = JSON.stringify(res.body.result.data)
                const expectedResult = JSON.stringify([TestInputsForConnectorsList.VALID_CONNECTORS_LIST_CATEGORY])
                result.should.be.eq(expectedResult)
                done();
            });
    })

    it("Connectors list Success: Filtered based on status", (done) => {
        chai.spy.on(ConnectorRegistry, "findAll", () => {
            return Promise.resolve([TestInputsForConnectorsList.VALID_CONNECTORS_LIST_STATUS])
        })
        chai 
            .request(app)
            .post("/v2/connectors/list")
            .send(TestInputsForConnectorsList.REQUEST_WITH_STATUS_FILTERS)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("SUCCESS")
                res.body.result.should.be.a("object")
                res.body.result.count.should.be.eq(1)
                res.body.params.msgid.should.be.eq(msgid)
                const result = JSON.stringify(res.body.result.data)
                const expectedResult = JSON.stringify([TestInputsForConnectorsList.VALID_CONNECTORS_LIST_STATUS])
                result.should.be.eq(expectedResult)
                done();
            });
    })

    it("Connectors list failure: Invalid request payload provided", (done) => {
        chai
            .request(app)
            .post("/v2/connectors/list")
            .send(TestInputsForConnectorsList.INVALID_REQUEST)
            .end((err, res) => {
                res.should.have.status(httpStatus.BAD_REQUEST);
                res.body.should.be.a("object")
                res.body.id.should.be.eq(apiId);
                res.body.params.status.should.be.eq("FAILED")
                res.body.error.code.should.be.eq("CONNECTORS_LIST_INPUT_INVALID")
                expect(res.body.error.message).to.match(/^(.+) must NOT have fewer than 1 items$/)
                done();
            });
    });

    it("Connectors list failure: RBAC enabled and user lacks a valid role", (done) => {
        config.is_RBAC_enabled = "true";
        chai.spy.on(userService, "getUser", () => {
            return Promise.resolve({ roles: [NO_ACCESS_ROLE] })
        })
        chai
            .request(app)
            .post("/v2/connectors/list")
            .set("Authorization", `Bearer ${buildRbacToken()}`)
            .send(TestInputsForConnectorsList.REQUEST_WITHOUT_FILTERS)
            .end((err, res) => {
                res.should.have.status(httpStatus.FORBIDDEN);
                done();
            });
    });
})