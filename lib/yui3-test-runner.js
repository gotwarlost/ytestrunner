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

var path = require('path'),
    util = require('util'),
    fs = require('fs'),
    vm = require('vm'),
    resolve = require('resolve'),
    Module = require('module'),
    BaseTestRunner = require('./base-test-runner'),
    YUI;

/*
 * loads YUI with helpful error message on load errors on how to fix the issue
 */
function loadYUI(libPath) {
    var mod = libPath ? path.join(libPath, 'yui') : 'yui';
    try {
        YUI = require(mod).YUI;
    } catch (ex) {
        console.error('require("' + mod + '") did not work; please ensure that yui is available as a devDependency for your package and is installed where this tester can access it');
        throw ex;
    }
}
/**
 * subclass of `BaseTestRunner` to run `yui3` style tests
 * @class Yui3TestRunner
 * @param options {Object}
 * @constructor
 */
function Yui3TestRunner(options) {
    BaseTestRunner.apply(this, arguments);
    this.moduleNames = [];
    this.seenModules = {};
    this.yconfig = options.yconfig;
}

util.inherits(Yui3TestRunner, BaseTestRunner);

/**
 * initializes this module by loading the test library
 * @method init
 * @protected
 */
Yui3TestRunner.prototype.init = function () {
    var configObject = {};
    loadYUI(this.testLibPath);
    if (this.yconfig) {
        try {
            configObject = require(this.yconfig);
        } catch (ex) {
            console.error('require("' + this.yconfig + '" did not work; ensure that your custom config is valid JSON or a valid configuration object exported by a node module');
            throw ex;
        }
        YUI.applyConfig(configObject);
    }
};
/**
 * implements the interface method to load a test file
 * @method loadFile
 * @param file the test file to load
 * @protected
 */
Yui3TestRunner.prototype.loadFile = function (file) {
    /*jslint nomen: true regexp: true */
    var that = this,
        code = fs.readFileSync(file, 'utf8'),
        wrappedCode,
        mod = { exports: {} },
        dir = path.dirname(file),
        resolver = function (request) {
            return resolve.sync(request, {
                paths: Module._paths || [],
                basedir: dir
            });
        },
        requireImpl = function (path) {
            return Module._load(resolver(path), module);
        },
        fn,
        addFn = function (name) {
            if (that.seenModules[name]) {
                throw new Error('Multiple test files found with the same module name [' + name + ']\nFile 1: ' + that.seenModules[name] + '\nFile2: ' + file);
            }
            that.seenModules[name] = file;
            that.moduleNames.push(name);
            YUI.add.apply(YUI, Array.prototype.slice.call(arguments));
        },
        fakeYUI = function () { throw new Error('Attempt to call the YUI function at load time, disallowed'); };

    Object.keys(YUI).forEach(function (k) {
        if (typeof YUI[k] === 'function') {
            fakeYUI[k] = function () { throw new Error('Attempt to call YUI.' + k + '() at load time, disallowed'); };
        }
    });
    fakeYUI.add = addFn;

    code = code.replace(/^\#\!.*/, ''); //shebang junk
    wrappedCode = '(function(exports, require, module, __filename, __dirname, YUI) {\n' + code + '\n})';

    Object.keys(require).forEach(function (key) {
        requireImpl[key] = require[key];
    });
    requireImpl.resolve = resolver;
    fn = vm.runInThisContext(wrappedCode, file);
    fn(mod.exports, requireImpl, mod, file, dir, fakeYUI);
};
/**
 * starts tests after attaching a completion event handler for writing results and coverage
 * @method startTests
 * @param callback the callback that will be invoked by the completion handler when all tests have run
 * @protected
 */
Yui3TestRunner.prototype.startTests = function (callback) {

    var Y = YUI(),
        that = this,
        args = [ 'test' ]; //always use the `test` module since that guarantees we will get a Y.Test.Runner to play with.

    args.push.apply(args, this.moduleNames);
    args.push(function (Y) {
        var runner = Y.Test.Runner,
            format = Y.Test.TestFormat;
        that.attachTestEventHandlers(runner, format, callback);
        runner.run();
    });

    Y.use.apply(Y, args);
};
module.exports = Yui3TestRunner;
