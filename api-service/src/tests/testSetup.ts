// Mocha --require hook, loaded before any spec file (after ts-node/register, per .mocharc.js's
// require order, so this can import real .ts modules and monkeypatch them before app.ts /
// Config.ts get imported by the first spec file).

// Tests stub Sequelize models directly and never send auth tokens, so RBAC must be off here;
// production still defaults is_RBAC_enabled to "true" in Config.ts.
process.env.is_rbac_enabled = "false";

// kafkaConnection.send() lazily calls connect() if not already connected, and connect() is not
// awaited by most callers (fire-and-forget telemetry/audit dispatch) -- against no real broker,
// this fires a real async connection attempt in the background during almost every test. That
// dangling promise's rejection can land at an arbitrary later point and, since chai-http reuses
// a shared HTTP agent across the whole suite, occasionally corrupts an unrelated test's
// in-flight response socket (`res` comes back undefined in a `.end((err, res) => ...)` that
// never checks `err`). Stubbing here removes the real network attempt suite-wide; individual
// tests can still sinon.stub these further for their own assertions (already done in
// DataIngestTest, which stubbed only per-test before this existed).
import * as kafkaConnection from "../connections/kafkaConnection";
(kafkaConnection as any).connect = async () => true;
(kafkaConnection as any).send = async () => ({});
(kafkaConnection as any).isHealthy = async () => true;
