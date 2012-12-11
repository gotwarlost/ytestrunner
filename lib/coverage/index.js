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
var util = require('util'),
    log = require('../util/log'),
    Y = require('./yui/index'),
    istanbul = require('istanbul'),
    fs = require('fs');

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
            console.log('Unhook loader');
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
        return Base.prototype.getSummary.call(this, coverage);
    },
    writeReport: function (jsonFile, dir, format, callback) {
        var reporter = new Y.Reporter({ verbose: this.opts.verbose });
        reporter.writeReport(jsonFile, dir, format, callback);
    }
});

function Istanbul(opts) {
    Base.call(this, opts);
}

util.inherits(Istanbul, Base);

mix(Istanbul, {
    setUp: function (includes, excludes, options, callback) {

        log.shout('Hook loader');
        var that = this,
            variable = '__cov' + new Date().getTime(),
            Instrumenter = istanbul.Instrumenter,
            instrumenter = new Instrumenter({
                coverageVariable: variable
            }),
            transformFn = instrumenter.instrumentSync.bind(instrumenter);

        this.coverageVariable = variable;
        istanbul.matcherFor({
            root: options.inputDir,
            includes: includes,
            excludes: excludes
        }, function (err, matchFn) {
            if (err) { return callback(err); }
            /*jslint nomen: true */
            istanbul.hook.hookRequire(matchFn, transformFn, {
                verbose: that.opts.verbose,
                postLoadHook: istanbul._yuiLoadHook(matchFn, transformFn, that.opts.verbose)
            });
            callback();
        });
    },
    tearDown: function () {
        if (this.opts.verbose) {
            console.log('Unhook loader');
        }
        istanbul.hook.unhookRequire();
    },
    getCoverage: function () {
        return global[this.coverageVariable] || null;
    },
    getSummary: function (coverage) {
        if ((coverage && typeof coverage === 'object')) {
            var utils = istanbul.utils,
                fileSummary = [],
                stats;
            Object.keys(coverage).forEach(function (key) {
                fileSummary.push(utils.summarizeFileCoverage(coverage[key]));
            });
            stats = utils.mergeSummaryObjects.apply(null, fileSummary);
            return 'Statement coverage: ' + stats.statements.pct + '%' +
                ', Branch coverage: ' + stats.branches.pct + '%' +
                ', Function coverage: ' + stats.functions.pct + '%' +
                ', Line coverage: ' + stats.lines.pct + '%';
        }
        return Base.prototype.getSummary.call(this, coverage);
    },
    writeReport: function (jsonFile, dir, format, callback) {
        try {
            var report = istanbul.Report.create(format, { dir: dir, verbose: this.opts.verbose }),
                Collector = istanbul.Collector,
                collector = new Collector();

            collector.add(JSON.parse(fs.readFileSync(jsonFile, 'utf8')));
            report.writeReport(collector, true);
            callback();
        } catch (ex) {
            callback(ex);
        }
    }
});

module.exports = {
    createPlugin: function (config) {
        var opts = {
            verbose: config.verbose
        };
        if (config.coverage) {
            if (process.env.running_under_istanbul) {
                if (opts.verbose) { console.log('Not turning on coverage since running under istanbul'); }
            } else {
                return config.istanbul ? new Istanbul(opts) : new YUICoverage(opts);
            }
        }
        return new Base(opts);
    }
};

