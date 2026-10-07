import app from "../../../app";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import httpStatus from "http-status";
import { describe, it } from "mocha";
import { TestInputsForGenerateDataSchema } from "./Fixtures";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("GENERATE DATA SCHEMA API", () => {

    afterEach(() => {
        chai.spy.restore();
    });

    it("should generate a schema instead of failing when a sample field value is null", (done) => {
        chai
            .request(app)
            .post("/v2/datasets/dataschema")
            .send(TestInputsForGenerateDataSchema.SAMPLE_WITH_NULL_FIELD)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                const schema = res.body.result.schema;
                schema.properties.should.have.property("promo_code");
                schema.properties.promo_code.type.should.be.eq("null");
                schema.properties.promo_code.suggestions.should.be.an("array").that.is.not.empty;
                schema.properties.promo_code.suggestions[0].resolutionType.should.be.eq("NULL_FIELD");
                // non-null fields should still resolve normally
                schema.properties.amount.data_type.should.be.eq("integer");
                done();
            });
    });

    it("should preserve nullability when a field is null in some records but typed in others", (done) => {
        chai
            .request(app)
            .post("/v2/datasets/dataschema")
            .send(TestInputsForGenerateDataSchema.SAMPLE_WITH_MIXED_NULL_AND_TYPED_FIELD)
            .end((err, res) => {
                res.should.have.status(httpStatus.OK);
                const schema = res.body.result.schema;
                const discountCode = schema.properties.discount_code;
                // majority type still wins for the actual resolution
                discountCode.type.should.be.eq("string");
                discountCode.data_type.should.be.eq("string");
                // but the fact that nulls were observed isn't silently dropped
                const oneofTypes = discountCode.oneof.map((entry: any) => entry.type);
                oneofTypes.should.include("string");
                oneofTypes.should.include("null");
                // fields without a conflict are unaffected
                schema.properties.amount.data_type.should.be.eq("integer");
                done();
            });
    });
});
