var path = require('path'),
    watcher = require('./watcher'),
    colors = require('colors'),
    rimraf = require('rimraf'),
    args,
    overrides;

function getTest(root, file, format, custom) {
    return function (test) {
        var expectedFile = path.resolve(root, file);
        if (format) {
            args.push('--results-format=' + format);
        }
        if (custom) {
            args.push('--results-file=' + custom);
        }
        watcher.run(args, function (err) {
            test.ok(!err, "should work without errors");
            test.ok(watcher.contains('Final summary: Passed: 1, Failed: 0, Skipped: 0, Total: 1, Load errors: 0, Line coverage: Unknown, Function coverage: Unknown'.green.bold),
                'should contain correct summary');
            test.ok(path.existsSync(expectedFile), 'should write ' + file);
            test.done();
        });
    };
}

function getCoverageTest(root, dir, expected, format, custom) {
    return function (test) {
        var expectedDir = path.resolve(root, dir),
            file = path.resolve(expectedDir, expected);

        if (format) {
            args.push('--coverage-report-format=' + format);
        }
        if (custom) {
            args.push('--coverage-file=' + custom);
        }
        watcher.run(args, function (err) {
            test.ok(!err, "should work without errors");
            test.ok(watcher.contains('Final summary: Passed: 1, Failed: 0, Skipped: 0, Total: 1, Load errors: 0, Line coverage: 100%, Function coverage: 100%'.green.bold),
                'should contain correct summary');
            test.ok(path.existsSync(expectedDir), 'should write ' + dir);
            test.ok(path.existsSync(file), 'should write ' + file);
            test.done();
        });
    };
}

function deleteFiles(root) {
    rimraf.sync(path.resolve(root, 'results.xml'));
    rimraf.sync(path.resolve(root, 'results.json'));
    rimraf.sync(path.resolve(root, 'results.tap'));
    rimraf.sync(path.resolve(root, 'resultsDir'));
}

function deleteCoverageFiles(root) {
    rimraf.sync(path.resolve(root, 'coverage'));
    rimraf.sync(path.resolve(root, 'my-coverage'));
}

module.exports = {
    createResultsTestCase: function (root, yui3, lcov, fcov) {
        yui3 = !!yui3;
        lcov = lcov || '100%';
        fcov = fcov || '100%';

        return {
            "when running tests": {
                setUp: function (cb) { deleteFiles(root); args = [ '--root=' + root, '--yui3=' + yui3, '--save-results=true' ]; cb(); },
                tearDown: function (cb) { deleteFiles(root); cb(); },

                "with --save-results turned on and nothing more" : getTest(root, 'results.xml', null),
                "with multiple formats of reports": {
                    "junitxml" : getTest(root, 'results.xml', 'junitxml'),
                    "jUnitXml" : getTest(root, 'results.xml', 'jUnitXml'),
                    "tap": getTest(root, 'results.tap', 'tap'),
                    "xml": getTest(root, 'results.xml', 'xml'),
                    "json": getTest(root, 'results.json', 'json')
                },
                "with custom file names": getTest(root, 'resultsDir/test-results.xml', null, 'resultsDir/test-results')
            }
        };
    },

    createCoverageTestCase: function (root, yui3, lcov, fcov) {
        yui3 = !!yui3;
        lcov = lcov || '100%';
        fcov = fcov || '100%';

        return {
            "when running tests": {
                setUp: function (cb) { deleteCoverageFiles(root); args = [ '--root=' + root, '--yui3=' + yui3, '--coverage=true', '--save-coverage=true' ]; cb(); },
                tearDown: function (cb) { deleteCoverageFiles(root); cb(); },

                "with --save-coverage turned on and nothing more" : getCoverageTest(root, 'coverage', 'lcov.info'),
                "with multiple formats of reports": {
                    "lcov" : getCoverageTest(root, 'coverage', 'lcov.info', 'lcov'),
                    "json": getCoverageTest(root, 'coverage', 'test-coverage.json', 'json'),
                    "html": getCoverageTest(root, 'coverage', 'index.html', 'html')
                },
                "with custom file names": getCoverageTest(root, 'my-coverage', 'cov.json', null, 'my-coverage/cov')
            }
        };
    }
};