ytestrunner [![Build Status](https://secure.travis-ci.org/gotwarlost/ytestrunner.png)](http://travis-ci.org/gotwarlost/ytestrunner)
===========

Run YUI tests for node packages using "npm test" with support for saving test results, coverage and more. Supports YUITest as well as YUI3 style tests.

To use this module, declare it as a `devDependency` along with the YUI module that you are using for tests (`yui` for yui3 style tests or `yuitest` for standalone yui tests).

![screenshot](http://github.com/gotwarlost/ytestrunner/raw/master/examples/screenshot.png)

Usage
-----

* Write some code (this module assumes, by default, that code will found at the source root and under `lib/`)
* Write tests using a supported format (this module assumes, by default, that tests will be found `test/`)
* Modify your `package.json` as follows

For tests that are implemented using `yuitest`:

    {
        "devDependencies": {
            "ytestrunner": "*",
            "yuitest": "*"
        },
        "scripts": {
            "test": "ytestrunner <other-args>"
        }
    }

For tests in YUI3 module format that are implemented using the `Y.Test` object from `yui` use:

    {
        "devDependencies": {
            "ytestrunner": "*",
            "yui": "*"
        },
        "scripts": {
            "test": "ytestrunner --yui3 <other-args>"
        }
    }

* To run your tests, just type:

`$ npm test`

in the folder that has your `package.json` file

The `ytestrunner` script will run all tests and store results and coverage, if requested.

Command line options
---------------------

    Usage: ytestrunner <options>

    Basic options
      --root <dir>               : the source root (default: .)
      --yui3                     : flag that enables the YUI3 test harness rather than the YUITest harness
      --verbose, -v              : run tests and instrumentation in verbose mode
      --help, -h                 : print this message
      --tmp <dir>                : tmp directory under which instrumented files will be written
                                   (default: /tmp)
      --colors                   : show colored output (use --no-colors to disable)

    Tests and results
      --include <pattern>        : include file patterns for test files
                                   (default: [test/**/*.js, tests/**/*.js])
      --exclude <pattern>        : exclude file patterns for test files
                                   (default: [ empty ])
      --save-results             : save results to disk
      --results-format <format>  : results file format
      --results-file <name>      : basename of results file without extension
                                   (default: results)

    Instrumentation and coverage
      --coverage, -c             : enable instrumentation and coverage stats
      --istanbul                 : use istanbul instead of YUI coverage for instrumentation and coverage stats
      --fast-cover               : skip source coverage if a newer instrumented file found from previous run
      --cov-include <pattern>    : include file patterns for JS files to be instrumented
                                   (default: [**/*.js])
      --cov-exclude <pattern>    : exclude file patterns for instrumentation
                                   (default: [test/**/*.js, tests/**/*.js, **/.*, **/node_modules/**])
      --save-coverage            : save JSON coverage information to disk
      --coverage-file <name>     : basename of JSON coverage file without extension
                                   (default: coverage/test-coverage)
      --coverage-report-format <format> : format of coverage report (default: lcov)


    In addition, the environment variable [ytestopts] can be set with override options.
    These take precedence over the options passed to command line.

Using this module effectively
-----------------------------

The module is designed so that it can provide test results and coverage information without having to write any files under your source tree. Saving results and coverage information to disk must be asked for explicitly.

This allows you to have a simple command in your `package.json` (e.g. `ytestrunner` or  `ytestrunner -c` for default coverage) and yet have an automated build set the `ytestopts` environment variable to control writing of results and coverage in supported formats.

Use of `ytestopts` is also useful during development. If you want to just run one test, say, `foo.test.js` and instrument only one file, say, `foo.js` you could set `ytestopts` thus:

    $ export ytestopts="--include=test/foo.test.js --cov-include=lib/foo.js"
    $ npm test


This strategy requires no changes to `package.json` and yet will only instrument your source under test and run only one test file.

Also, keep in mind that boolean options can be negated. So, if your `test` script says `ytestrunner -c` and you are not interested in coverage, you could set `ytestopts` to `--no-coverage` to disable coverage.

Examples
--------

See the strawman examples in the directories yuitest-sample and yui3-test-sample. Run `npm install` and `npm test` in either of those directories.

A word on code coverage
-----------------------

Code coverage is implemented as follows:

* Create an instrumented version of all JS files matching the coverage filters somewhere under `/tmp`. This is done using the `yuitest-coverage` java module.
* Hook the module loader to serve the instrumented content at `require` time when the original file is requested. This step is skipped for a file if the coverage module reports an error when instrumenting it.
* Collect stats from the global coverage object created by the instrumented code at the end of all tests
* Save coverage information and write reports if requested using the `yuitest-coverage-report` java module

Debugging test execution
------------------------

The `-v` option is your friend.

Caveats and known issues
------------------------

* This module must *not* be globally installed. Even though it uses a YUI test library as part of its runtime execution, it does *not* declare dependencies on these. The caller is responsible for declaring this module as well as the test library used as `devDependencies`. This strategy ensures that this module uses the same instance of the testing library that your tests use.
* For the same reason, this module may *not* be npm-linked into your package either, since linked modules cannot "see" other dependencies under your `node_modules/` folder.
* A modern `java` is required for instrumentation and coverage reports.
* Since instrumentation is done by transparently substituting the instrumented file for the original at `require` time, stack traces will refer to original file but the line numbers in the instrumented file and will *not* make sense when code coverage is turned on

License
-------

ytestrunner is licensed under the [MIT License](http://github.com/gotwarlost/ytestrunner/raw/master/LICENSE).

Third-party libraries
---------------------

The following third-party libraries are used by this module:

* async: https://github.com/caolan/async
* colors: https://github.com/Marak/colors.js
* fileset: https://github.com/mklabs/node-fileset
* mkdirp: https://github.com/substack/node-mkdirp
* nopt: https://github.com/isaacs/nopt
* resolve: https://github.com/substack/node-resolve
* nodeunit: https://github.com/caolan/nodeunit (dev dependency for unit tests of this module)

and enables running tests supported by these libraries:

* YUITest: https://github.com/yui/yuitest
* YUI: https://github.com/yui/

Credits
-------

   * [mfncooper](https://github.com/mfncooper) - for ideas on module loader hooks to support code coverage
   * [baechul](https://github.com/baechul) - for ideas on standard test running using `Y.Test.Runner`
   * [nzakas](https://github.com/nzakas) - test loading strategy for `YUITest` tests heavily influenced by command line support in that module
   * [davglass](https://github.com/davglass) - for review of this module

