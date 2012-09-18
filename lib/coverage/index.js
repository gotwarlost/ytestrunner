var util = require('util'),
    log = require('../util/log'),
    Y = require('./yui/index');

function mix(cons, proto) {
    Object.keys(proto).forEach(function (key) {
        cons.prototype[key] = proto[key];
    });
}

function Base(opts) { this.opts = opts || {}; }

Base.prototype = {
    setUp: function (includes, excludes, options, callback) {
        callback();
    },
    tearDown: function () {
    },
    getCoverage: function (runner) {
        return {};
    },
    getSummary: function (coverage) {
        return 'Line coverage: Unknown, Function coverage: Unknown';
    },
    writeReport: function (jsonFile, dir, format, callback) {
    }
};

function YUICoverage(opts) {
    Base.call(this, opts);
}

util.inherits(YUICoverage, Base);

mix(YUICoverage, {
    setUp: function (includes, excludes, options, callback) {

        log.shout('instrument code');
        var instrumenter = new Y.Instrumenter(options),
            that = this;
        instrumenter.instrumentFiles(includes, excludes, function (err, data) {
            if (err) {
                return callback(err);
            }
            Y.hookLoader(data.fileMap, that.opts.verbose);
            return callback();
        });
    },
    tearDown: function () {
        if (this.opts.verbose) {
            console.log('Unhook loader')
        }
        Y.unhookLoader();
    },
    getCoverage: function (runner) {
        return runner && runner.getCoverage ? runner.getCoverage() : null;
    },
    /*
     * calculates the line and function coverage given coverage info
     */
    calculateCoveragePercent: function (coverage) {
        if (!(coverage && typeof coverage === 'object')) {
            return null;
        }

        var ret = { calledLines: 0, coveredLines: 0, calledFunctions: 0, coveredFunctions: 0 };
        Object.keys(coverage).forEach(function (key) {
            var data = coverage[key];
            ret.calledLines += data.calledLines || 0;
            ret.calledFunctions += data.calledFunctions || 0;
            ret.coveredLines += data.coveredLines || 0;
            ret.coveredFunctions += data.coveredFunctions || 0;
        });

        ret.lineCoverage = ret.coveredLines ? Math.round(ret.calledLines * 100 * 100 / ret.coveredLines) / 100 : 0;
        ret.functionCoverage = ret.coveredFunctions ? Math.round(ret.calledFunctions * 100 * 100 / ret.coveredFunctions) / 100 : 0;
        return ret;
    },
    getSummary: function (coverage) {
        var stats = this.calculateCoveragePercent(coverage);
        if (stats) {
            return 'Line coverage: ' + stats.lineCoverage + '%' + ', Function coverage: ' + stats.functionCoverage + '%';
        }
    },
    writeReport: function (jsonFile, dir, format, callback) {
        var reporter = new Y.Reporter({ verbose: this.opts.verbose });
        reporter.writeReport(jsonFile, dir, format, callback);
    }
});

module.exports = {
    createPlugin: function (config) {
        var opts = {
            verbose: config.verbose
        };
        if (config.coverage) {
            return new YUICoverage(opts);
        } else {
            return new Base(opts);
        }
    }
};

