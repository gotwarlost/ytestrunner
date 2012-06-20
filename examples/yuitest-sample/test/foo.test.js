var Y = require('yuitest'),
    Assert = Y.Assert;

Y.TestRunner.add(new Y.TestCase({

    name : 'Foo Test Case',

    "should get correct value for foo": function () {
        Assert.areSame('foo', require('../lib/foo').getFoo());
    }
}));
