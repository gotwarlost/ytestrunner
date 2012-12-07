YUI.add('foo', function (Y) {

    var secret = 'foobar';

    Y.namespace('Foo').Whisper = {
        getSecret: function () {
            return secret;
        }
    };

}, '0.0.1', {});