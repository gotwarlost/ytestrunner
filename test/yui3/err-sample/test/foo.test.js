YUI.add('test-bar', function (Y) {
    var Assert = Y.Assert,
        foo = require('../lib/bar'); XXX Syntax error

    Y.Test.Runner.add(new Y.Test.Case({

        name: 'Foo Test Case',

        "should get correct value for foo": function () {
            Assert.areSame('baz', foo.getFoo());
        }
    }));

}, '0.0.1', { requires: [ 'test'] });
