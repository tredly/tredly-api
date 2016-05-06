'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var Config = require('../lib/config');
var Jwt = require('../lib/jwt');
var tools = require('../lib/tools');

var USERS_CONFIG = tools.USERS_CONFIG;

module.exports = function (router) {

    router.post('/auth/login', function* (next) {
        var self = this;

        var config = new Config();
        var secret = yield config.get('secret');

        var usersConfig = new Config(USERS_CONFIG);
        var userName = self.request.body.username;
        var user = yield usersConfig.get(userName);

        var jwt = new Jwt({
            secret: secret
        });

        var password = self.request.body.password || '';
        var passwordHash = jwt.createHash(password);

        if (!userName || !user || !password ||
            user.passwordHash !== passwordHash) {
            self.status = 401;
            return;
        }

        self.body = {
            token: jwt.format(_.extend(user, {
                name: userName
            }))
        };
        self.status = 200;
    });

    router.post('/auth/refresh', function* (next) {
        var self = this;

        var config = new Config();
        var secret = yield config.get('secret');

        var jwt = new Jwt({
            secret: secret
        });

        var payload = jwt.parse(self.request.body.token);

        var usersConfig = new Config(USERS_CONFIG);
        var userName = payload.name;
        var user = yield usersConfig.get(userName);

        if (!user || !payload ||
            user.passwordHash !== payload.passwordHash) {
            self.status = 401;
            return;
        }

        self.body = {
            token: jwt.format(_.extend(user, {
                name: userName
            }))
        };
        self.status = 200;
    });

    router.post('/create/user', function* (next) {
        var self = this;

        var info = yield tools.getUser(this, { fullInfo: true });

        var user = info.user;
        var jwt = info.jwt;

        if (!user.admin) {
            self.body = tools.prepareText('Access denied', { red: true, newLine: true });
            self.status = 401;
            return;
        }

        var username = self.request.body.username;
        var password = self.request.body.password;
        var admin = _.isBoolean(self.request.body.admin) ? self.request.body.admin : (
            self.request.body.admin === 'true' ? true : false
            );

        if (!username || !password) {
            self.body = tools.prepareText('Please, provide username and password', { red: true, newLine: true });
            self.status = 400;
            return;
        }

        var passwordHash = jwt.createHash(password);

        var usersConfig = new Config(USERS_CONFIG);

        var existingUser = yield usersConfig.get(username);
        if (existingUser) {
            self.body = tools.prepareText('User ' + username + ' already exists', { red: true, newLine: true });
            self.status = 400;
            return;
        }

        yield usersConfig.set(username, _.extend(existingUser, {
            passwordHash: passwordHash,
            admin: admin
        }));

        self.body = tools.prepareText('User created: ' + username, { green: true, newLine: true });
        self.status = 200;
    });

    router.post('/edit/user', function* (next) {
        var self = this;

        var info = yield tools.getUser(this, { fullInfo: true });

        var user = info.user;
        var jwt = info.jwt;

        var username = self.request.body.username;
        var password = self.request.body.password;
        var admin = _.isUndefined(self.request.body.admin) ? undefined : (
            _.isBoolean(self.request.body.admin) ? self.request.body.admin : (
                self.request.body.admin === 'true' ? true : false
                )
            );

        if (!username) {
            self.body = tools.prepareText('Please, provide username', { red: true, newLine: true });
            self.status = 400;
            return;
        }

        if (!user.admin && (username !== user.name || !_.isUndefined(admin))) {
            self.body = tools.prepareText('Access denied', { red: true, newLine: true });
            self.status = 401;
            return;
        }

        var passwordHash = password ? jwt.createHash(password) : undefined;

        var usersConfig = new Config(USERS_CONFIG);

        var existingUser = yield usersConfig.get(username);
        if (!existingUser) {
            self.body = tools.prepareText('User ' + username + ' does not exist', { red: true, newLine: true });
            self.status = 400;
            return;
        }

        yield usersConfig.set(username, _.defaults({
            passwordHash: passwordHash,
            admin: admin
        }, existingUser));

        self.body = tools.prepareText('User updated: ' + username, { green: true, newLine: true });
        self.status = 200;
    });

    router.post('/remove/user', function* (next) {
        var self = this;

        var info = yield tools.getUser(this, { fullInfo: true });

        var user = info.user;
        var jwt = info.jwt;

        if (!user.admin) {
            self.body = tools.prepareText('Access denied', { red: true, newLine: true });
            self.status = 401;
            return;
        }

        var username = self.request.body.username;

        if (!username) {
            self.body = tools.prepareText('Please, provide username', { red: true, newLine: true });
            self.status = 400;
            return;
        }

        var usersConfig = new Config(USERS_CONFIG);

        var existingUser = yield usersConfig.get(username);
        if (!existingUser) {
            self.body = tools.prepareText('User ' + username + ' does not exist', { red: true, newLine: true });
            self.status = 400;
            return;
        }

        yield usersConfig.set(username, null);

        self.body = tools.prepareText('User removed: ' + username, { green: true, newLine: true });
        self.status = 200;
    });

    router.post('/list/users', function* (next) {
        var self = this;

        var info = yield tools.getUser(this, { fullInfo: true });

        var user = info.user;
        var jwt = info.jwt;

        if (!user.admin) {
            self.body = tools.prepareText('Access denied', { red: true, newLine: true });
            self.status = 401;
            return;
        }

        self.status = 200;

        var usersConfig = new Config(USERS_CONFIG);

        var users = yield usersConfig.list();

        var result = {
            data: _.map(users, function (user, username) {
                return {
                    'UserName': username,
                    'Role': user.admin ? 'admin' : ''
                }
            })
        };

        if (!tools.acceptsJson(self)) {
            result = tools.formatTable(result.data, {
                title: 'Listing All Users',
                total: (result.data.length || 0) + ' users listed.'
            })
        }

        self.body = result;
    });
};