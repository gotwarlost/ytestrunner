module.exports = function () {
    return { me: 'a1', msg: require('./foo').hello() };
};
