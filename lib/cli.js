#!/usr/bin/env node
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
    nopt = require('nopt'),
    fileset = require('fileset'),
    log = require('./util/log'),
    YuiTestRunner = require('./yuitest-runner'),
    Yui3TestRunner = require('./yui3-test-runner'),
    coverage = require('./coverage'),
    ENV_OPTS = 'ytestopts',
    defaultTestIncludes = ['test/**/*.js', 'tests/**/*.js'],
    defaultTestExcludes = [],
    defaultCoverageIncludes = [ '**/*.js' ],
    defaultCoverageExcludes = [ 'test/**/*.js', 'tests/**/*.js', '**/.*', '**/node_modules/**' ],
    cacheBuster = 1,
    util = require('util');

/**
 * Command-line entry point to the test runner, also exposed as a library.
 * @class CLI
 */

/**
 * given an object, replaces 'dashed-keys' with camelcase dashedKeys
 * @param obj the object for which keys need to be replaced
 * @method makeCamelCase
 * @static
 * @private
 */
function makeCamelCase(obj) {
    var DASH_PATTERN = /[\-]([a-z])/g,
        camelCaseWord = function (word) {
            return word.replace(DASH_PATTERN, function (match, lch) {
                return lch.toUpperCase();
            });
        };
    Object.keys(obj).forEach(function (key) {
        var camel = camelCaseWord(key);
        if (camel !== key) {
            obj[camel] = obj[key];
            delete obj[key];
        }
    });
}
/**
 * returns defaults to be merged into the configuration if not explicitly supplied
 * @param args
 */
function getDefaults() {
    return {
        root: process.cwd(),
        tmp: '/tmp',
        init: null,
        include: defaultTestIncludes,
        exclude: defaultTestExcludes,
        coverage: false,
        istanbul: true,
        covInclude: defaultCoverageIncludes,
        covExclude: defaultCoverageExcludes,
        resultsFile: 'results',
        resultsFormat: 'junitxml',
        coverageFile: 'coverage/test-coverage',
        coverageReportFormat: 'lcov',
        fastCover: false
    };
}
/**
 * prints a usage message
 * @private
 * @static
 */
function usage() {

    var defs = getDefaults(),
        optionsHelp = [
            {
                group: 'Basic options',
                values: [
                    { name: 'root', arg: 'dir', desc: 'the source root', defaultValue : '.' },
                    { name: 'yui3', desc: 'flag that enables the YUI3 test harness rather than the YUITest harness' },
                    { name: 'yconfig', arg: 'file', desc: 'A JSON/ JS file that will be `require`d by the YUI3 test runner. The output of the require will be assumed to be a YUI configuration that is applied to the YUI instance' },
                    { name: 'verbose', alias: '-v', desc: 'run tests and instrumentation in verbose mode' },
                    { name: 'help', alias: '-h', desc: 'print this message' },
                    { name: 'tmp', arg: 'dir', desc: 'tmp directory under which instrumented files will be written', defaultValue: '/tmp' },
                    { name: 'colors', desc: 'show colored output (use --no-colors to disable)', defaultValue: defs.colors }
                ]
            },
            {
                group: 'Tests and results',
                values: [
                    { name: 'init', arg: 'init-file', desc: 'initialize fixtures using async `initialize` function loaded from `init-file`' },
                    { name: 'include', arg: 'pattern', desc: 'include file patterns for test files', defaultValue: '[' + defs.include.join(', ') + ']' },
                    { name: 'exclude', arg: 'pattern',desc: 'exclude file patterns for test files', defaultValue: '[' + (defs.exclude.join(', ') || ' empty ') + ']' },
                    { name: 'save-results', desc: 'save results to disk' },
                    { name: 'results-format', arg: 'format', desc: 'results file format' },
                    { name: 'results-file', arg: 'name', desc: 'basename of results file without extension', defaultValue: defs.resultsFile }
                ]
            },
            {
                group: 'Instrumentation and coverage',
                values: [
                    { name: 'coverage', alias: '-c', desc: 'enable instrumentation and coverage stats' },
                    { name: 'istanbul', desc: 'use istanbul instead of YUI coverage for instrumentation and coverage stats' },
                    { name: 'fast-cover', desc: 'skip source coverage if a newer instrumented file found from previous run' },
                    { name: 'cov-include', arg: 'pattern', desc: 'include file patterns for JS files to be instrumented', defaultValue: '[' + defs.covInclude.join(', ') + ']' },
                    { name: 'cov-exclude', arg: 'pattern', desc: 'exclude file patterns for instrumentation', defaultValue: '[' + defs.covExclude.join(', ') + ']' },
                    { name: 'save-coverage', desc: 'save JSON coverage information to disk' },
                    { name: 'coverage-file', arg: 'name', desc: 'basename of JSON coverage file without extension', defaultValue: defs.coverageFile },
                    { name: 'coverage-report-format', arg: 'format', desc: 'format of coverage report', defaultValue: defs.coverageReportFormat }
                ]
            }
        ],
        valueFormatter = function (v) {
            var str = '\t--' + v.name,
                leading = '       ',
                padding = '                           ',
                def = v.defaultValue ? '(default: ' + v.defaultValue + ')' : '';
            if (v.arg) { str += ' <' + v.arg + '>'; }
            if (v.alias) { str += ', ' + v.alias; }
            str += padding.substring(0, padding.length -str.length);
            str += ' : ';
            str += v.desc;
            if (def) {
                if (str.length + def.length > 80) {
                    str +=  '\n' + padding + '    ' + def;
                } else {
                    str += ' ' + def;
                }
            }
            return str +'\n';
        },
        groupFormatter = function (group) {
            var str = '\n' + group.group + '\n';
            group.values.forEach(function (v) { str += valueFormatter(v); });
            return str;
        },
        optionsFormatter = function() {
            var str = '';
            optionsHelp.forEach(function (o) { str += groupFormatter(o); });
            return str.replace(/\t/g,'  ');
        };

    console.log('\nUsage: ytestrunner <options>\n' + optionsFormatter());
    console.log('\nIn addition, the environment variable [ytestopts] can be set with override options.\nThese take precedence over the options passed to command line.\n')
}
/**
 * uses nopt to get command line arguments
 * @param args the 0 based argument array to process
 * @return config
 * @method getOptions
 * @static
 * @private
 */
function getOptions(args) {

    var allowed,
        shortcuts,
        options;

    allowed = {
        root: path,
        yui3:   Boolean,
        verbose: Boolean,
        help: Boolean,
        colors: Boolean,
        yconfig: path,

        init: path,
        include: [ Array, String ],
        exclude: [ Array, String ],

        'save-results': Boolean,
        'results-format' : String,
        'results-file' : String,

        coverage: Boolean,
        istanbul: Boolean,
        'fast-cover': Boolean,
        'save-coverage': Boolean,
        'coverage-report-format': String,
        'coverage-file' : String,

        'cov-include': [ Array, String ],
        'cov-exclude': [ Array, String ],
        'tmp': path
    };

    shortcuts = {
        'v': '--verbose',
        'c': '--coverage',
        'r': '--save-results',
        'h': '--help'
    };

    options = nopt(allowed, shortcuts, args, 0);
    makeCamelCase(options);
    if (options.colors === undefined) { options.colors = true; }
    return options;
}
/**
 * returns a final configuration after applying command line options and potential overrides when
 * the `ytestopts` environment variable is set.
 * @param args 0-based args to process
 * @return {config} the final configuration for the runner
 * @method getFinalOptions
 * @static
 * @private
 */
function getFinalOptions(args) {

    var opts = getOptions(args),
        defaults = getDefaults(),
        overrideEnv = process.env[ENV_OPTS],
        overrideOpts;

    //allow overrides for test formats/ filenames and coverage filename in an automated build
    if (overrideEnv) {
        console.log('Applying override options [' + overrideEnv + ']')
        overrideOpts = getOptions(overrideEnv.split(/\s+/));
        Object.keys(overrideOpts).forEach(function (key) {
            if (key !== 'argv' && typeof overrideOpts[key] !== 'function') {
                opts[key] = overrideOpts[key];
            }
        });
    }

    delete opts.argv;

    Object.keys(defaults).forEach(function (key) {
        if (!opts.hasOwnProperty(key)) {
            opts[key] = defaults[key];
        }
    });

    opts.resultsFile = path.resolve(opts.root, opts.resultsFile);
    opts.coverageFile = path.resolve(opts.root, opts.coverageFile);

    return opts;
}
/**
 * library entry point to the test runner without argument processing
 * @method runWithConfig
 * @param config the configuration object
 * @param callback the callback
 * @static
 * @private
 */
function runConfig(config, callback) {

    if (config.help) { return usage(); }
    log.setVerbose(config.verbose);
    log.setColors(config.colors);

    if (config.verbose) {
        console.log('Config is:')
        console.dir(config);
    }

    var plugin,
        includes = config.include,
        excludes = config.exclude,
        realCallback = function (err, data) {
            plugin.tearDown();
            return callback(err, data);
        },
        mainFn = function (err) {
            if (err) {
                return realCallback(err);
            }

            var root = config.root,
                runner,
                opts = { cwd: root };

            config.coveragePlugin = plugin;
            runner = config.yui3 ? new Yui3TestRunner(config) : new YuiTestRunner(config);

            cacheBuster += 1;
            opts['x' + cacheBuster] = true; //workaround minimatch cache bug https://github.com/isaacs/minimatch/issues/9
            fileset(includes.join(' '), excludes.join(' '), opts, function (err, files) {
                if (err) {
                    console.error('Error finding files for fileset');
                    return realCallback(err);
                }
                try {
                    files = files.map(function (f) { return path.resolve(root, f); });
                    runner.runTests(files, config.init, realCallback);
                } catch (ex) {
                    console.error('runTests returned an error');
                    return realCallback(ex);
                }
            });
        };

    plugin = coverage.createPlugin(config);
    plugin.setUp(config.covInclude,
        config.covExclude,
        {
            inputDir: config.root,
            outputDir: path.resolve(config.tmp, 'instrumented'),
            fastCover: config.fastCover,
            java: config.java
        },
        mainFn);
}
/**
 * library entry point to the test runner
 * @param args the 0-based array of arguments to be processed
 * @param callback the callback that is called with an error and data object
 * @method run
 * @static
 */
function run(args, callback) {
    var config = getFinalOptions(args);
    runConfig(config, callback);
}
/**
 * command-line entry point to the test runner
 * @method main
 * @static
 * @private
 */
function main() {

    process.once('uncaughtException', function (ex) {
        util.error('Uncaught exception!');
        log.logError(ex);
        process.exit(2);
    });

    run(process.argv.slice(2), function (err, data) {

       if (err) {
           throw err;
       }

       if (data.ok) {
           process.exit(0);
       } else {
           util.error(data.error);
           process.exit(1);
       }
    });
}

//allow usage as library and only run when main
module.exports = {
    runConfig: runConfig,
    run: run
};

if (require.main === module) {
    main();
}

