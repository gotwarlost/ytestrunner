/*jslint nomen: true */
var path = require('path'),
    rimraf = require('rimraf'),
    dataDir = path.resolve(__dirname, '..', 'data', 'instrumenter'),
    outDir = path.resolve(dataDir, 'output'),
    Instrumenter = require('../../lib/coverage').Instrumenter;

module.exports = {
    setUp: function (cb) { rimraf.sync(outDir); cb(); },
    tearDown: function (cb) { /*rimraf.sync(outDir);*/ cb(); },

    "when instrumenting a single file" : function (test) {
        var inst = new Instrumenter({ inputDir: dataDir, outputDir: outDir, verbose: true });
        inst.instrumentFile('bad.js', function (err) {
            console.log('Error was:' + err);
            test.ok(!err);
            test.done();
        });
    }
};
