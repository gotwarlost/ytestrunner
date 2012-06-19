var Y = require('yuitest'),
    Assert = Y.Assert;

Y.TestRunner.add(new Y.TestCase({

    name: 'Good Test Case',

    "should get correct value for foo": function () {
        Assert.areSame('bar', require('../lib/foo').getFoo());
    }
}));
