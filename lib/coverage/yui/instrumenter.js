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
    path = require('path'),
    async = require('async'),
    spawn = require('child_process').spawn,
    fileset = require('fileset'),
    fs = require('fs'),
    child_process = require('child_process'),
    mkdirp = require('mkdirp'),
    cacheBuster = 0;
/*
 * checks a path for existence, optionally creating it
 * @param path the path to check
 * @param maybeCreate true if the path should be created when non-existent, false otherwise
 */
function checkPath(path, maybeCreate) {
    try {
        var stats = fs.statSync(path);
    } catch (ex) {
        if (maybeCreate && ex.code === 'ENOENT') {
            mkdirp.sync(path);
        } else {
            throw ex;
        }
    }
}
/**
 * library that uses the yui coverage tool for instrumenting files for coverage
 * @class Instrumenter
 * @param opts {Object}
 * @constructor
 */
function Instrumenter(opts) {

    var inputDir,
        outputDir;

    opts = opts || {};

    inputDir = opts.inputDir;
    outputDir = opts.outputDir;

    if (!inputDir) { throw new Error('inputDir must be specified!'); }
    if (!outputDir) { throw new Error('outputDir must be specified!'); }

    checkPath(inputDir, false);
    checkPath(outputDir, true);

    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.verbose = !!opts.verbose;
    this.java = opts.java || 'java';
    this.fastCover = !!opts.fastCover;

    /*jslint nomen: true */
    this.jarFile = opts.jarFile || path.resolve(__dirname, '..', '..', 'vendor', 'yuitest-coverage.jar');
}

Instrumenter.prototype = {
    /**
     * instruments all files under the input directory tree based on the include/ exclude fileset patterns
     * specified.
     * @method instrumentFiles
     * @param includes array of include patterns
     * @param excludes array of exclude patterns
     * @param callback receives an object with successCount, failureCount and an input-output fileMap for all
     *  successfully instrumented files
     */
    instrumentFiles: function (includes, excludes, callback) {
        var that = this,
            fileMap = {},
            sCount = 0,
            eCount = 0,
            skipCount = 0,
            opts = { cwd: this.inputDir };

        cacheBuster += 1;
        opts['x' + cacheBuster] = true; //workaround minimatch cache bug https://github.com/isaacs/minimatch/issues/9
        fileset(includes.join(' '), excludes.join(' '), opts, function (err, files) {

            if (err) {
                console.error('Error finding files for fileset');
                return callback(err);
            }

            async.forEachSeries(files,
                function (file, cb) {
                    var filePath = path.join(that.inputDir, file);
                    that.instrumentFile(file, function (err, outFile, skipped) {
                        if (err) {
                            eCount += 1;
                            console.error(err);
                        } else {
                            sCount += 1;
                            skipCount += skipped ? 1 : 0;
                            fileMap[filePath] = outFile;
                        }
                        cb(null); //always success from async's viewpoint
                    });
                },
                function (err) {
                    if (!err && skipCount > 0) { //emit a message, even in non-verbose mode, that some files skipped instrumentation
                        console.log(String(skipCount) + ' file(s) not instrumented, since they already exist from a previous run');
                    }
                    return callback(err, { successCount: sCount, failureCount: eCount, skipCount: skipCount, fileMap: fileMap });
                });
        });
    },
    /**
     * instruments a single file specified as relative to path to the input directory
     * @method instrumentFile
     * @param relativePath the relative path from the input directory
     * @param callback null error and output path as data when successfully instrumented; error object otherwise
     */
    instrumentFile: function (relativePath, callback) {

        var inputPath = path.resolve(this.inputDir, relativePath),
            outputPath = path.resolve(this.outputDir, relativePath),
            outputDir = path.dirname(outputPath),
            args = [ '-jar', this.jarFile, '-o', outputPath, inputPath ],
            that = this,
            handle,
            inStat,
            outStat,
            skipFile = false;

        checkPath(outputDir, true);

        if (this.fastCover) { //check if instrumented file already exists and has a later timestamp
            try {
                outStat = fs.statSync(outputPath);
                inStat = fs.statSync(inputPath);
                if (outStat.mtime.getTime() > inStat.mtime.getTime()) {
                    skipFile = true;
                }
            } catch (ex) { console.error(ex); } //swallow, just an optimization
        }

        if (skipFile) {
            if (that.verbose) { console.log('Skip instrumentation for [' + inputPath + '] since newer instrumented file [' + outputPath + '] already exists'); }
            return callback(null, outputPath, true);
        }
        if (this.verbose) {
            console.log(this.java + ' ' + args.join(' '));
        }
        handle = spawn(this.java, args);

        handle.stdout.on('data', function (data) { if (that.verbose) { process.stdout.write(data); } });
        handle.stderr.on('data', function (data) { if (that.verbose) { process.stderr.write(data); } });
        handle.on('exit', function (code) {
            if (code === 0) {
                return callback(null, outputPath);
            } else {
                return callback('instrumentation failed for file[' + inputPath + '], run wth verbose for details');
            }
        });
    }
};

module.exports = Instrumenter;
