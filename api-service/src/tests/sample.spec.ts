import { describe, it } from 'mocha';
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";

chai.use(spies);
chai.should();
chai.use(chaiHttp);

describe("Sample Test case", () => {
    it("Case1", (done) => {
        done();
    })
})
