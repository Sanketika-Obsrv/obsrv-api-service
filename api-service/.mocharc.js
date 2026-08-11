module.exports = {
    require: ["ts-node/register", "src/tests/testSetup.ts"],
    spec: "src/tests/**/*.spec.ts",
    exit: true
};
