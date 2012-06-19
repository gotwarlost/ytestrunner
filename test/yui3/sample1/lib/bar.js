module.exports = {
    getBar: function () { return require('baz').getBaz(); } //tests require of a module from under node_modules
};
