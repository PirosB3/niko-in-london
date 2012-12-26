var config = module.exports;

config["My tests"] = {
    env: "node",
    rootPath: "./",
    sources: [
        "utils.js",
        "persistence.js"
    ],
    tests: [
        "test.js"
    ]
};
