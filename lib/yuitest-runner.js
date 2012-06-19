/*
 Copyrights for code authored by Yahoo! Inc. is licensed under the following
 terms:

 MIT License

 Copyright (c) 2011 Yahoo! Inc. All Rights Reserved.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to
 deal in the Software without restriction, including without limitation the
 rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 sell copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 DEALINGS IN THE SOFTWARE.
 */

var BaseTestRunner = require('./base-test-runner'),
    util = require('util'),
    path = require('path'),
    YUITest;

/*
 * loads YUI with helpful error message on load errors on how to fix the issue
 */
function loadYUITest(libPath) {
    var mod = libPath ? path.join(libPath, 'yuitest') : 'yuitest';
    try {
        YUITest = require(mod);
    } catch (ex) {
        console.error('require("' + mod + '") did not work; please ensure that yuitest is available as a devDependency for your package and is installed where this tester can access it');
        throw ex;
    }
}
/**
 * subclass of `BaseTestRunner` to run `yuitest` style tests
 * @class YuiTestRunner
 * @param options {Object}
 * @constructor
 */
function YuiTestRunner(options) {
    BaseTestRunner.apply(this, arguments);
}

util.inherits(YuiTestRunner, BaseTestRunner);

/**
 * initializes this module by loading the test library
 * @method init
 */
YuiTestRunner.prototype.init = function () {
    loadYUITest(this.testLibPath);
};
/**
 * implements the interface method to load a test file
 * @method loadFile
 * @param file the test file to load
 * @return none
 */
YuiTestRunner.prototype.loadFile = function (file) {
    return require(file); //TODO: support webcompat option
};
/**
 * starts tests after attaching a completion event handler for writing results and coverage
 * @method startTests
 * @param callback the callback that will be invoked by the completion handler when all tests have run
 */
YuiTestRunner.prototype.startTests = function (callback) {
    var runner = YUITest.TestRunner,
        format = YUITest.TestFormat;

    this.attachTestEventHandlers(runner, format, callback);
    YUITest.TestRunner.run(); //TODO: support groups
};

module.exports = YuiTestRunner;
