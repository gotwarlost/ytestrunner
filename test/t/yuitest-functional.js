/*jslint nomen: true */
var path = require('path'),
    root = path.resolve(__dirname, '..', 'yuitest', 'sample1'),
    eRoot = path.resolve(__dirname, '..', 'yuitest', 'err-sample'),
    common = require('../common/common-functional'),
    reporting = require('../common/common-reporting');

module.exports = {
    "happy path": common.createHappyTestCase(root, false),
    "failure/ load error path": common.createErrorTestCase(eRoot, false),
    "failure path with env overrides": common.createErrorTestCase(eRoot, false, true),
    "reporting tests": reporting.createResultsTestCase(root, false),
    "coverage reporting tests": reporting.createCoverageTestCase(root, false)
};
