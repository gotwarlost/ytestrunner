YUI.add('foo-test', function (Y, NAME) {

    var util = require('util');
    //util.puts(util.inspect(Y, undefined, 10));
    var whisper = Y.Foo.Whisper,
        suite = new Y.Test.Suite(NAME),
        A = Y.Assert;

    suite.add(new Y.Test.Case({
        'test my module': function () {
            A.areEqual('foobar', whisper.getSecret());
        }
    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', { requires: ['test', 'foo'] });


