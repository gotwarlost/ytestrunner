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
/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    Module = require('module'),
    originalLoader = Module._extensions['.js'];
/**
 *  facade for coverage functionality
 *
 *  @class Coverage
 */
/**
 * hooks the module loader, substituting the instrumented file for the original one at `require` time
 * @method hookLoader
 * @param fileMap the map of original paths to corresponding instrumented paths
 * @param verbose true if info messages should be shown when a specific module is substituted
 * @private
 * @static
 */
function hookLoader(fileMap, verbose) {
    Module._extensions['.js'] = function (module, filename) {
        var realFile = fileMap[filename] || filename,
            content;
        if (realFile !== filename) {
            if (verbose) {
                console.log('Module load hook: replace [' + filename + '] with [' + realFile + ']');
            }
            content = fs.readFileSync(realFile, 'utf8');
            module._compile(content, filename);
        } else {
            return originalLoader(module, filename);
        }
    };
}
/**
 * unhooks the module loader, restoring to pristine state
 * @method unhookLoader
 * @private
 * @static
 */
function unhookLoader() {
    Module._extensions['.js'] = originalLoader;
}

module.exports = {
    hookLoader: hookLoader,
    unhookLoader: unhookLoader,
    Instrumenter: require('./instrumenter'),
    Reporter: require('./reporter')
};

