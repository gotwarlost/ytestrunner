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

var colors = require('colors'),
    util = require('util'),
    verbose = false,
    colorLog = false;

function out(str) {
    if (colorLog) { str = str.bold; }
    console.log(str);
}

function err(str) {
    if (colorLog) { str = str.bold; str = str.red; }
    util.error(str);
}
/**
 * @class Log
 */
module.exports = {
    /**
     * sets if verbose logging is required
     * @method setVerbose
     * @param flag - true if verbose logging is desired
     * @static
     */
    setVerbose: function (flag) {
        verbose = flag;
    },
    /**
     * sets if colorized logging is required
     * @method setColors
     * @param flag - true if verbose logging is desired
     * @static
     */
    setColors: function (flag) {
        colorLog = flag;
    },
    /**
     * function to make a string more noticeable by "shouting" it out. This is usually done only in verbose mode unless
     * specifically overridden
     * @method shout
     * @param str the string to be made noticeable
     * @param always unconditionally shout when true
     * @static
     */
    shout: function (str, always) {
        if (verbose || always) {
            out('================================================================================');
            out(str);
            out('================================================================================');
        }
    },
    /**
     * logs an error object to stderr
     * @method logError
     * @param ex the exception to log
     * @static
     */
    logError: function (ex) {
        if (ex.hasOwnProperty('message')) {
            err('[details] ' + ex.message);
            if (ex.stack) {
                err('[stack] ' + ex.stack);
            }
        } else {
            err(ex);
        }
    }
};
