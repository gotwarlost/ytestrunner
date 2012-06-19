/*jslint nomen: true */
var coverage = require('../../lib/coverage/index'),
    path = require('path'),
    a1 = path.resolve(__dirname, '..', 'data', 'dir1', 'a1.js'),
    a2 = path.resolve(__dirname, '..', 'data', 'dir2', 'subdir', 'a2.js'),
    b1 = path.resolve(__dirname, '..', 'data', 'dir1', 'b1.js'),
    b2 = path.resolve(__dirname, '..', 'data', 'dir1', 'subdir', 'b2.js');

module.exports = {
    "when the loader is hooked": {
        setUp: function (cb) {
            var fileMap = {};
            fileMap[a1] = a2;
            fileMap[b1] = b2;
            coverage.hookLoader(fileMap, true);
            cb();
        },
        "ensure alternate files loaded, with original relative paths": function (test) {
            var fn = require(a1),
                ret = fn();
            test.equals('a2', ret.me, 'a2 should be loaded');
            test.equals('dir1', ret.msg, 'but ./foo should be loaded from dir1 and not dir2/subdir');
            test.done();
        },
        "and then unhooked": {
            setUp: function (cb) {
                coverage.unhookLoader();
                cb();
            },
            "things should return back to normal": function (test) {
                var fn = require(b1),
                    ret = fn();
                test.equals('b1', ret.me, 'b1 should be loaded');
                test.equals('dir1', ret.msg, 'and ./foo should be loaded from dir1 as usual');
                test.done();
            }
        }
    }
};
