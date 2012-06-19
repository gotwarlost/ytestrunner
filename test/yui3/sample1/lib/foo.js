var bar = require('./bar'); //this `require` ensures that relative path requires work under instrumentation

module.exports = {
    getFoo: function () { return bar.getBar(); }
};

