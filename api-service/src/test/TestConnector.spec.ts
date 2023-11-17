import { DbConnector } from "../connectors/DbConnector";
import { KafkaConnector } from "../connectors/KafkaConnector";
import { HTTPConnector } from "../connectors/HttpConnector";
import chai from "chai";
import chaiHttp from "chai-http";
import spies from "chai-spies";
import { describe, it } from 'mocha';

 
chai.use(spies);
chai.should();
chai.use(chaiHttp);

const dbConnectorConfig = {
    client: "postgresql",
    connection: {
        host: 'localhost',
        port: 5432,
        database: 'test',
        user: 'test',
        password: 'test',
    }
}

describe("Testing Db connector", () => {
    it("should successfully arrange connection with database", (done) => {
        const dbConnector = new DbConnector(dbConnectorConfig);
        chai.spy.on(dbConnector.pool, "select", () => {
            return Promise.resolve()
        })
        dbConnector.init()
        chai.expect(dbConnector.pool.select).to.be.called
        chai.spy.restore(dbConnector.pool, "select")
        done()
    })
    it("should not connect to database", (done) => {
        const dbConnector = new DbConnector(dbConnectorConfig);
        chai.spy.on(dbConnector, "connect", () => {
            return Promise.reject("error occurred while connecting to postgres")
        })
        dbConnector.init()
        chai.expect(dbConnector.connect).to.be.called
        chai.spy.restore(dbConnector, "connect")
        done()
    })
    it("should not insert records into database", (done) => {
        const dbConnector = new DbConnector(dbConnectorConfig);
        chai.spy.on(dbConnector, "insertRecord", () => {
            return Promise.reject(new Error("error occurred while connecting to postgres"))
        })
        dbConnector.execute("insert", { "table": "users", "fields": {} })
        chai.expect(dbConnector.insertRecord).to.be.called
        chai.spy.restore(dbConnector, "insertRecord")
        done()
    })
    it("should insert record into database", (done) => {
        const dbConnector = new DbConnector(dbConnectorConfig);
        chai.spy.on(dbConnector, "insertRecord", () => {
            return Promise.resolve([])
        })
        dbConnector.execute("insert", { "table": "users", "fields": {} })
        chai.expect(dbConnector.insertRecord).to.be.called
        chai.spy.restore(dbConnector, "insertRecord")
        done()
    })
    it("should not update records in database", (done) => {
        const dbConnector = new DbConnector(dbConnectorConfig);
        chai.spy.on(dbConnector, "updateRecord", () => {
            return Promise.reject(new Error("error occurred while connecting to postgres"))
        })
        dbConnector.execute("update", { "table": "users", "fields": {} })
        chai.expect(dbConnector.updateRecord).to.be.called
        chai.spy.restore(dbConnector, "updateRecord")
        done()
    })
    it("should update records in database", (done) => {
        const dbConnector = new DbConnector(dbConnectorConfig);
        chai.spy.on(dbConnector, "updateRecord", () => {
            return Promise.resolve([])
        })
        dbConnector.execute("update", { "table": "users", "fields": {} })
        chai.expect(dbConnector.updateRecord).to.be.called
        chai.spy.restore(dbConnector, "updateRecord")
        done()
    })
    it("should throw error while updating records into database", (done) => {
        const dbConnector = new DbConnector(dbConnectorConfig);
        chai.spy.on(dbConnector.pool, "transaction", () => {
            return Promise.reject(new Error("error occurred while connecting to postgres"))
        })
        dbConnector.execute("update", { "table": "users", "fields": {} })
        chai.expect(dbConnector.updateRecord).throw
        chai.spy.restore(dbConnector.pool, "transaction")
        done()
    })
    it("should not throw error while updating records into database", (done) => {
        const dbConnector = new DbConnector(dbConnectorConfig);
        chai.spy.on(dbConnector.pool, "transaction", () => {
            return (Promise.resolve([]))
        })
        dbConnector.execute("update", { "table": "users", "fields": {} })
        chai.expect(dbConnector.updateRecord).to.not.throw
        chai.spy.restore(dbConnector.pool, "transaction")
        done()
    })
    it("should not retrieve records from database", (done) => {
        const dbConnector = new DbConnector(dbConnectorConfig);
        chai.spy.on(dbConnector, "readRecords", () => {
            return Promise.reject(new Error("error occurred while connecting to postgres"))
        })
        dbConnector.execute("read", { "table": "users", "fields": {} })
        chai.expect(dbConnector.readRecords).to.be.called
        chai.spy.restore(dbConnector, "readRecords")
        done()
    })
    it("should retrieve records from database", (done) => {
        const dbConnector = new DbConnector(dbConnectorConfig);
        chai.spy.on(dbConnector, "readRecords", () => {
            return Promise.resolve([])
        })
        dbConnector.execute("read", { "table": "users", "fields": {} })
        chai.expect(dbConnector.readRecords).to.be.called
        chai.spy.restore(dbConnector, "readRecords")
        done()
    })
    it("should not disconnect from the database", (done) => {
        const dbConnector = new DbConnector(dbConnectorConfig);
        chai.spy.on(dbConnector.pool, "destroy", () => {
            return Promise.reject(new Error("error occurred while disconnecting from postgres"))
        })
        dbConnector.close()
        chai.expect(dbConnector.pool.destroy).to.throw
        chai.spy.restore(dbConnector.pool, "destroy")
        done()
    })
    it("should disconnect from the database", (done) => {
        const dbConnector = new DbConnector(dbConnectorConfig);
        chai.spy.on(dbConnector.pool, "destroy", () => {
            return Promise.resolve()
        })
        dbConnector.close()
        chai.expect(dbConnector.pool.destroy).to.not.throw
        chai.spy.restore(dbConnector.pool, "destroy")
        done()
    })
    it("should list records", (done)=>{
        const dbConnector = new DbConnector(dbConnectorConfig);
        chai.spy.on(dbConnector.pool, "select", () => {
            return Promise.resolve()
        })
        dbConnector.listRecords('datasets')
        chai.expect(dbConnector.pool.select).to.not.throw
        chai.spy.restore(dbConnector.pool, "select")
        done()
    })
})
describe('testing httpConnector', () => {
    describe('execute', () => {
        it('should throw an error', (done) => {
            const sampleHttpInstance = new HTTPConnector('example.com');
            const spy = chai.spy.on(sampleHttpInstance, 'execute');
            (() => sampleHttpInstance.execute('sample string')).should.throw(Error);
            spy.should.have.been.called.once;
            chai.spy.restore(sampleHttpInstance, 'execute')
            done()
        });
    });

    describe('close', () => {
        it('should throw an error', (done) => {
            const sampleHttpInstance = new HTTPConnector('example.com');
            const spy = chai.spy.on(sampleHttpInstance, 'close');
            (() => sampleHttpInstance.close()).should.throw(Error);
            spy.should.have.been.called.once;
            chai.spy.restore(sampleHttpInstance, 'execute')
            done()
        });
    });

})
describe("testing kafkaConnector", () => {
    describe('close', () => {
        it('should throw an error', (done) => {
            const sampleKafkaInstance = new KafkaConnector();
            const spy = chai.spy.on(sampleKafkaInstance, 'close');
            (() => sampleKafkaInstance.close()).should.throw(Error);
            spy.should.have.been.called.once;
            chai.spy.restore(sampleKafkaInstance, 'execute')
            done()
        });
    });

})