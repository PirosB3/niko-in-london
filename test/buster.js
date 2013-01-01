var config = module.exports;

config["My tests"] = {
    env: "node",
    rootPath: "../",
    sources: [
        "libs/utils.js",
        "libs/persistence.js"
    ],
    tests: [
        "test/test.js"
    ]
};
