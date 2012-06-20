#!/usr/bin/env node

var path = require('path'),
    async = require('async'),
    child_process = require('child_process'),
    fs = require('fs'),
    rimraf = require('rimraf');

//explicitly install the latest code into every sample dir and then do a regular npm install to install other dependencies
function setup(callback) {
    var src = path.resolve(__dirname, '..'),
        target = __dirname;

    console.log('Cleaning...');
    rimraf.sync(path.join(target, 'node_modules'));
    console.log('installing code to test root');
    child_process.exec(['npm', 'install', src].join(' '), { cwd:target, env:process.env }, function (err, stdout, stderr) {
        console.log(stdout);
        if (err) {
            console.error(stderr);
            return callback(err);
        } else {
            console.log('resolving other dependencies for test root');
            child_process.exec(['npm', 'install' ].join(' '), { cwd:target, env:process.env }, function (err, stdout, stderr) {
                console.log(stdout);
                if (err) {
                    console.error(stderr);
                    return callback(err);
                } else {
                    return callback();
                }
            });
        }
    });
}

//run all tests
function runTests(err, pat) {
    if (err) {
        throw err;
    }
    pat = pat || /(.*)+\.js$/;
    if (typeof pat === 'string') { pat = new RegExp(pat); }
    var reporter = require('nodeunit').reporters.default,
        files = fs.readdirSync(path.resolve(__dirname, 't'))
            .filter(function (f) { return pat.exec(f); })
            .map(function (f) { return path.resolve(__dirname, 't', f).substring(process.cwd().length); });

    console.log('Running tests: ' + files);
    reporter.run(files);
}

if (process.env.noisy) {
    require('./common/watcher').noisy(true);
}

delete process.env.ytestopts; //ensure this does not cause a side-effect in any way
if (process.env.localtest) { //assume setup run
    var testPat = process.env.testpat || null;
    runTests(null, testPat);
} else {
    setup(runTests);
}
