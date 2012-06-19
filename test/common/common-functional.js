var path = require('path'),
    watcher = require('./watcher'),
    colors = require('colors'),
    args,
    overrides;

module.exports = {
    createHappyTestCase: function (root, yui3, lcov, fcov) {
        yui3 = !!yui3;
        lcov = lcov || '100%';
        fcov = fcov || '100%';

        return {
            "when running tests": {
                setUp: function (cb) { args = [ '--root=' + root, '--yui3=' + yui3 ]; cb(); },

                "with the simplest possible args" : function (test) {
                    watcher.run(args, function (err) {
                        test.ok(!err, "should work without errors");
                        test.ok(watcher.contains('Final summary: Passed: 1, Failed: 0, Skipped: 0, Total: 1, Load errors: 0, Line coverage: Unknown, Function coverage: Unknown'.green.bold),
                            'should contain correct summary with colors');
                        test.ok(!watcher.matches(/Config is:/), 'should not show any verbose messages');
                        test.ok(!watcher.matches(/load tests/), 'should not show any verbose messages');
                        test.ok(!watcher.matches(/run tests/), 'should not show any verbose messages');
                        test.done();
                    });
                },
                "with coverage turned on": {
                    setUp: function (cb) { args.push.apply(args, ['--coverage=true', '--verbose=true']); cb(); },
                    "should calculate coverage": function (test) {
                        watcher.run(args, function (err) {
                            test.ok(!err, "should work without errors");
                            test.ok(watcher.contains('load tests'.bold), 'should show test loading section');
                            test.ok(watcher.contains('run tests'.bold), 'should print test running section');
                            test.ok(watcher.contains('instrument code'.bold), 'should show instrumentation section');
                            test.ok(watcher.matches(/Module load hook:/), 'should show alternate files being loaded');
                            test.ok(watcher.contains(('Final summary: Passed: 1, Failed: 0, Skipped: 0, Total: 1, Load errors: 0, Line coverage: ' + lcov + ', Function coverage: ' + fcov).green.bold),
                                'should contain correct summary with colors and coverage');
                            test.done();
                        });
                    }
                },
                "with verbose args": {
                    setUp: function (cb) { args.push('--verbose=true'); cb(); },
                    "should print verbose messages": function (test) {
                        watcher.run(args, function (err) {
                            test.ok(!err, "should work without errors");
                            test.ok(watcher.contains('Config is:'), 'should print config');
                            test.ok(watcher.contains('load tests'.bold), 'should show test loading section');
                            test.ok(watcher.contains('run tests'.bold), 'should print test running section');
                            test.ok(!watcher.matches(/instrument files/), 'should not show instrumentation section');
                            test.ok(watcher.contains('Final summary: Passed: 1, Failed: 0, Skipped: 0, Total: 1, Load errors: 0, Line coverage: Unknown, Function coverage: Unknown'.green.bold),
                                'should contain correct summary with colors');
                            test.done();
                        });
                    },
                    "and no colors": {
                        setUp: function (cb) { args.push('--no-colors=true'); cb(); },
                        "should print messages without colors": function (test) {
                            watcher.run(args, function (err) {
                                test.ok(!err, "should work without errors");
                                test.ok(watcher.contains('Config is:'), 'should print config');
                                test.ok(watcher.contains('load tests'), 'should show test loading section');
                                test.ok(watcher.contains('run tests'), 'should print test running section');
                                test.ok(!watcher.matches(/instrument files/), 'should not show instrumentation section');
                                test.ok(watcher.contains('Final summary: Passed: 1, Failed: 0, Skipped: 0, Total: 1, Load errors: 0, Line coverage: Unknown, Function coverage: Unknown'),
                                    'should contain correct summary without colors');
                                test.done();
                            });
                        }
                    }
                }
            }
        };
    },

    createErrorTestCase: function (root, yui3, useEnv) {
        return {
            setUp: function (cb) { args = [ '--root=' + root, '--yui3=' + yui3 ]; overrides = ''; cb(); },
            "when run with default args": {
                "should show load errors and failures": function (test) {
                    watcher.run(args, function (err) {
                        test.ok(err === 1, "should exit 1");
                        test.ok(watcher.errMatches(/\[details\] Unexpected identifier/), 'should have a stack of the load issue');
                        test.ok(watcher.errContains('1 test(s) failed. Details:'), 'should show summary count of tests that failed');
                        test.ok(watcher.errContains('1 test(s) could not be loaded. Details:'), 'should show summary of load errors');
                        test.ok(watcher.errContains('	Cause: ComparisonFailure'), 'should show failure cause');
                        test.ok(watcher.contains('Final summary: Passed: 1, Failed: 1, Skipped: 0, Total: 2, Load errors: 1, Line coverage: Unknown, Function coverage: Unknown'.red.bold),
                            'should contain correct summary');
                        test.done();
                    });
                },
                "but when bad load file excluded": {
                    setUp: function (cb) {
                        if (useEnv) {
                            overrides = '--exclude=**/foo.test.js';
                        } else {
                            args.push('--exclude=**/foo.test.js');
                        }
                        cb();
                    },
                    "should show only failures and still exit 1": function (test) {
                        watcher.run(args, overrides, function (err) {
                            test.ok(err === 1, "should exit 1");
                            test.ok(!watcher.errMatches(/\[details\] Unexpected identifier/), 'should NOT have a stack of the load issue');
                            test.ok(watcher.errContains('1 test(s) failed. Details:'), 'should show summary count of tests that failed');
                            test.ok(watcher.errContains('	Cause: ComparisonFailure'), 'should show failure cause');
                            test.ok(watcher.contains('Final summary: Passed: 1, Failed: 1, Skipped: 0, Total: 2, Load errors: 0, Line coverage: Unknown, Function coverage: Unknown'.red.bold),
                                'should contain correct summary');
                            test.done();
                        });
                    }
                },
                "but when failure file excluded": {
                    setUp: function (cb) {
                        if (useEnv) {
                            overrides = '--exclude=**/bar.test.js';
                        } else {
                            args.push('--exclude=**/bar.test.js');
                        }
                        cb();
                    },
                    "should show only load errors and still exit 1": function (test) {
                        watcher.run(args, overrides, function (err) {
                            test.ok(err === 1, "should exit 1");
                            test.ok(watcher.errMatches(/\[details\] Unexpected identifier/), 'should have a stack of the load issue');
                            test.ok(watcher.errContains('1 test(s) could not be loaded. Details:'), 'should show summary of load errors');
                            test.ok(watcher.contains('Final summary: Passed: 1, Failed: 0, Skipped: 0, Total: 1, Load errors: 1, Line coverage: Unknown, Function coverage: Unknown'.red.bold),
                                'should contain correct summary');
                            test.done();
                        });
                    }
                },
                "and when all bad stuff excluded" : {
                    setUp: function (cb) {
                        if (useEnv) {
                            overrides = '--exclude=**/bar.test.js --exclude=**/foo.test.js';
                        } else {
                            args.push('--exclude=**/bar.test.js', '--exclude=**/foo.test.js');
                        }
                        cb();
                    },
                    "should pass and exit 0": function (test) {
                        watcher.run(args, overrides, function (err) {
                            test.ok(!err, "should exit 0");
                            test.ok(watcher.contains('Final summary: Passed: 1, Failed: 0, Skipped: 0, Total: 1, Load errors: 0, Line coverage: Unknown, Function coverage: Unknown'.green.bold),
                                'should contain correct summary');
                            test.done();
                        });
                    }
                },
                "and when only good stuff included": {
                    setUp: function (cb) {
                        if (useEnv) {
                            overrides = '--include=**/good.test.js';
                        } else {
                            args.push('--include=**/good.test.js');
                        }
                        cb();
                    },
                    "should pass and exit 0": function (test) {
                        watcher.run(args, overrides, function (err) {
                            test.ok(!err, "should exit 0");
                            test.ok(watcher.contains('Final summary: Passed: 1, Failed: 0, Skipped: 0, Total: 1, Load errors: 0, Line coverage: Unknown, Function coverage: Unknown'.green.bold),
                                'should contain correct summary');
                            test.done();
                        });
                    }
                },
                "and when everything excluded": {
                    setUp: function (cb) {
                        if (useEnv) {
                            overrides = '--exclude=**/*.js';
                        } else {
                            args.push('--exclude=**/*.js');
                        }
                        cb();
                    },
                    "should fail and exit 1": function (test) {
                        watcher.run(args, overrides, function (err) {
                            test.ok(err === 1, "should exit 1");
                            test.ok(watcher.contains('Final summary: Passed: 0, Failed: 0, Skipped: 0, Total: 0, Load errors: 0, Line coverage: Unknown, Function coverage: Unknown'.red.bold),
                                'should contain correct summary');
                            if (overrides) {
                                test.ok(watcher.contains('Applying override options [' + overrides + ']'));
                            }
                            test.ok(watcher.errContains('No tests actually executed'), 'should show msg about no tests present');
                            test.done();
                        });
                    }
                }
            }
        };
    }
};