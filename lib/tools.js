'use strict';

var _ = require('lodash');

var Config = require('./config');
var Jwt = require('./jwt');
var Table = require('./table');


module.exports = {
    USERS_CONFIG: 'users',
    getUser: getUser,
    prepareText: prepareText,
    createToken: createToken,
    acceptsJson: acceptsJson,
    formatTable: formatTable
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
    } else if (options.pink) {
        result += '\u001b[35m';
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
    } else if (options.pink) {
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

function acceptsJson (context) {
    return context.header.accept === 'application/json';
}

function formatTable (data, options) {
    options = options || {};

    var template = '';
    if (options.title) {
        template += prepareText(new Array(options.title.length + 1).join('='), { bold: true, pink: true, newLine: true });
        template += prepareText(options.title, { bold: true, pink: true, newLine: true });
        template += prepareText('', { newLine: true });
    }
    template += prepareText('--------------------', { newLine: true });
    template += prepareText('{table}', { newLine: false });
    template += prepareText('--------------------', { newLine: true });
    if (options.total) {
        template += prepareText(options.total, { newLine: true });
        template += prepareText('--------------------', { newLine: true });
    }

    var table = new Table({
        tableRegex: /\{table\}/igm,
        tablePrefix: '',
        tableSuffix: ''
    });

    return table.format(data, {
        tableText: template
    });
}

