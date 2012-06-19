var path = require('path'),
    watcher = require('../common/watcher'),
    colors = require('colors'),
    root = path.resolve(__dirname, '..', 'yui3', 'err-multi'),
    args,
    overrides;

module.exports = {
    "when tests share the same module name" : {
        setUp: function (cb) { args = [ '--root=' + root, '--yui3=true', '--verbose=true' ]; cb(); },
        "testing should fail at load time": function (test) {
            watcher.run(args, function (err) {
                test.equals(1, err, "should exit with failure status");
                test.ok(watcher.errMatches(/Multiple test files found with the same module name \[shared-name\]/, 'should have correct err message'));
                test.done();
            });
        }
    },
    "when a test uses YUI as a function" : {
        setUp: function (cb) { args = [ '--root=' + root, '--include=test2/bad.test.js', '--yui3=true', '--verbose=true' ]; cb(); },
        "should barf at load time with a meaningful message": function (test) {
            watcher.run(args, function (err) {
                test.equals(1, err, "should exit with failure status");
                test.ok(watcher.errMatches(/\[details\] Attempt to call the YUI function at load time, disallowed/, 'should have correct err message'));
                test.done();
            });
        }
    }
};