var bar = require('./bar');

module.exports = {
    getFoo: function () { return 'foo'; },
    getBar: function () { return bar.getBar(); }
};

