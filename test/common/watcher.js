/*jslint nomen: true */
var path = require('path'),
    spawn = require('child_process').spawn,
    stdout,
    stderr,
    realLog = false;

function noisy(flag) {
    realLog = flag;
}

function env(overrides) {
    var ret = {};
    Object.keys(process.env).forEach(function (k) { ret[k] = process.env[k]; });
    if (overrides) { ret.ytestopts = overrides; }
    return ret;
}

function toMap(data) {
    var array = data.split(/\n/),
        ret = {};

    array.forEach(function (line) {
        if (!ret[line]) { ret[line] = 0; }
        ret[line] += 1;
    });

    return ret;
}

function run(args, overrides, callback) {
    var cmd = 'node',
        file = path.join(__dirname, '..', 'node_modules', 'ytestrunner', 'lib', 'cli.js'),
        handle,
        outData = '',
        errData = '';

    args.unshift(file);
    if (typeof overrides === 'function' && !callback) {
        callback = overrides;
        overrides = '';
    }

    if (realLog) {
        console.log(cmd + ' ' + args.join(' '));
    }

    handle = spawn(cmd, args, { cwd: process.cwd(), env: env(overrides) });
    handle.stdout.setEncoding('utf8');
    handle.stderr.setEncoding('utf8');
    handle.stdout.on('data', function (data) { outData += data; if (realLog) { process.stdout.write(data); } });
    handle.stderr.on('data', function (data) { errData += data; if (realLog) { process.stderr.write(data); } });
    handle.on('exit', function (exitCode) {
        stdout = toMap(outData);
        stderr = toMap(errData);
        return callback(exitCode === 0 ? null : exitCode);
    });
}

function contains(str) {
    if (stdout[str]) {
        stdout[str] -= 1;
        return true;
    }
    return false;
}

function matches(pat) {
    return Object.keys(stdout).filter(function (k) {
        return k.match(pat);
    }).length;
}

function errContains(str) {
    if (stderr[str]) {
        stderr[str] -= 1;
        return true;
    }
    return false;
}

function errMatches(pat) {
    return Object.keys(stderr).filter(function (k) {
        return k.match(pat);
    }).length;
}

module.exports = {
    run: run,
    contains: contains,
    errContains: errContains,
    matches: matches,
    errMatches: errMatches,
    noisy: noisy
};
