module.exports = function () {
    return { me: 'b2', msg: require('./foo').hello() };
};