'use strict';

var _ = require('lodash');

var Config = require('./config');
var Jwt = require('./jwt');


module.exports = {
    USERS_CONFIG: 'users',
    getUser: getUser,
    prepareText: prepareText,
    createToken: createToken
};

function* getUser (context, options) {
    options = options || {};

    var config = new Config();
    var secret = yield config.get('secret');

    var jwt = new Jwt({
        secret: secret
    });

    var user = yield jwt.verify(context);

    if (options.fullInfo) {
        return {
            user: user,
            config: config,
            jwt: jwt
        };
    }

    return user;
}


function prepareText (text, options) {
    options = options || {};

    var result = '';

    if (options.bold) {
        result += '\u001b[1m';
    }

    if (options.red) {
        result += '\u001b[31m';
    } else if (options.green) {
        result += '\u001b[32m';
    }

    if (options.size) {
        text = _.padEnd(_.truncate(text || '', { length: options.size }), options.size);
    }

    if (options.newLine) {
        text += '\n';
    }

    result += text;

    if (options.red) {
        result += '\u001b[39m';
    } else if (options.green) {
        result += '\u001b[39m';
    }

    if (options.bold) {
        result += '\u001b[22m';
    }

    return result;
}

function createToken (length) {
    length = length || 32;

    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }

    return str;
}
