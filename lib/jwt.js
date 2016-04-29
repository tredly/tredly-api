'use strict';

//////////////////////////////////////////////////////////////////////////
// Copyright 2016 Vuid Pty Ltd
// https://www.vuid.com
//
// This file is part of tredly-api.
//
// tredly-api is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// tredly-api is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with tredly-api.  If not, see <http://www.gnu.org/licenses/>.
//////////////////////////////////////////////////////////////////////////

var crypto = require('crypto');
var atob = require('atob');
var btoa = require('btoa');
var _ = require('lodash');


module.exports = Jwt;

function Jwt (options) {
    this.options = _.defaults(options, {
        algorithm: 'aes-256-cbc',
        iv: 'f23!325+0pz3.-/a'
    });
}

Jwt.prototype.createHash = function (text, options) {
    options = options || {};

    return crypto
        .createHash('sha' + (options.version || '256'))
        .update(text).digest(options.encoding || 'base64');
};

Jwt.prototype.createSignature = function (header, payload) {
    return crypto
        .createHmac('SHA256', this.options.secret)
        .update(header + '.' + payload)
        .digest('base64')
        .replace(/=+$/, '');
};

Jwt.prototype.encrypt = function (payload) {
    var cipher  = crypto.createCipheriv(this.options.algorithm, this.options.secret, this.options.iv);
    var encrypted = cipher.update(payload, 'binary', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
};

Jwt.prototype.decrypt = function (payload) {
    var encryptedMessage = new Buffer(payload, 'base64').toString('binary');
    var decipher = crypto.createDecipheriv(this.options.algorithm, this.options.secret, this.options.iv),
    decrypted = decipher.update(encryptedMessage, 'binary', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

Jwt.prototype.format = function (payload, options) {
    var header = {
        'typ':'JWT',
        'alg': this.options.algorithm
    };

    var encodedHeader = btoa(JSON.stringify(header));

    var now = new Date().getTime();

    payload.iat = payload.iat || parseInt(now / 1000);
    payload.exp = payload.exp || parseInt(new Date(now + 30 * 60000).getTime() / 1000);

    var encodedPayload = btoa(
        this.encrypt(JSON.stringify(payload))
    ).replace(/=+$/, '');

    var signature = this.createSignature(encodedHeader, encodedPayload);

    return [encodedHeader, encodedPayload, signature]
        .join('.')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
};

Jwt.prototype.parse = function (token, options) {

    var split = token
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .split('.');

    if (split.length !== 3) {
        throw new Error('Invalid JWT');
    }

    var header    = split[0];
    var payload   = split[1];
    var signature = split[2];

    var decodedHeader = JSON.parse(atob(header));

    if (this.options.algorithm !== decodedHeader.alg) {
        throw new Error('JWT is encoded with different algorithm');
    }

    var confirm = this.createSignature(header, payload);
    if (signature !== confirm) {
        throw new Error('Invalid signature');
    }

    for(var i = 0; i < (4 - (payload.length % 4)); ++i) {
        payload += '=';
    }

    var decryptedPayload = JSON.parse(this.decrypt(atob(payload)));

    if (!options || !options.ignoreExpiry) {
        if (new Date(decryptedPayload.exp * 1000) < new Date()) {
            throw new Error('This JWT has expired');
        }
    }

    return decryptedPayload;
};

Jwt.prototype.verify = function* (context) {
    var authorization = context.header.authorization;
    if (authorization) {
        var split = authorization.split(' ');
        var scheme = split[0];
        var token = split[1];
        if (!/^Bearer$/i.test(scheme)) {
            throw new Error('Bad Authorization header format. Format is "Authorization: Bearer <token>"');
        } else {
            return this.parse(token);
        }
    } else {
        throw new Error('No Authorization header found');
    }
};

