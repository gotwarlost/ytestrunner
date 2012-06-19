/*jslint nomen: true */
var path = require('path'),
    root = path.resolve(__dirname, '..', 'yui3', 'sample1'),
    eRoot = path.resolve(__dirname, '..', 'yui3', 'err-sample'),
    common = require('../common/common-functional'),
    reporting = require('../common/common-reporting');
module.exports = {
    "happy path": common.createHappyTestCase(root, true),
    "failure/ load error path": common.createErrorTestCase(eRoot, true),
    "failure path with env overrides": common.createErrorTestCase(eRoot, true, true),
    "reporting tests": reporting.createResultsTestCase(root, true),
    "coverage reporting tests": reporting.createCoverageTestCase(root, true)
};

