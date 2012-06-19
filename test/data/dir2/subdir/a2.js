module.exports = function () {
    return { me: 'a2', msg: require('./foo').hello() };
};