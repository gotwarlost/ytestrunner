YUI.add('shared-name', function (Y) {
    var Assert = Y.Assert,
        foo = require('../lib/foo');

    Y.Test.Runner.add(new Y.Test.Case({

        name: 'Foo Test Case',

        "should get correct value for foo": function () {
            Assert.areSame('bar', foo.getFoo());
        }
    }));

}, '0.0.1', { requires: [ 'test'] });
