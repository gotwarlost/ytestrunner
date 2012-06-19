module.exports = function () {
    return { me: 'b1', msg: require('./foo').hello() };
};
