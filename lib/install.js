'use strict';

require('colors');

var co = require('co');
var path = require('path');
var read = require('read');
var _ = require('lodash');
var minimist = require('minimist');
var child_process = require('child_process');

var Config = require('./config');
var Jwt = require('./jwt');
var tools = require('./tools');

process.on('uncaughtException', function (p) {
    console.log('Error: '.red, p);
    process.exit(1);
});
process.on('unhandledRejection', function (reason, p) {
    console.log('Error: '.red, p);
    process.exit(1);
});



co(function* () {

    var args = minimist(process.argv.slice(2));

    var config = new Config();

    var usersConfig = new Config(tools.USERS_CONFIG);

    var users = yield usersConfig.list();
    var admin = _.find(users, function (user, name) { return user.admin; });

    var username = null;
    var password = null;

    if (!admin) {
        username = args.username || (yield new Promise (function (resolve, reject) {
            read({
                prompt: 'Admin user name: '.green.bold
            }, function (err, res) {
                if (err) {
                    console.log(err.message.red);
                    return resolve();
                }
                resolve(res);
            });
        }));

        if (!username) {
            console.log('Installation cancelled by user'.red);
            process.exit(1);
            return;
        }

        password = args.password || (yield new Promise (function (resolve, reject) {
            read({
                prompt: 'Admin password: '.green.bold,
                silent: true
            }, function (err, res) {
                if (err) {
                    console.log(err.message.red);
                    return resolve();
                }
                resolve(res);
            });
        }));

        if (!password) {
            console.log('Installation cancelled by user'.red);
            process.exit(1);
            return;
        }
    }

    var port = yield config.get('port');

    if (!port) {
        port = args.port || (yield new Promise (function (resolve, reject) {
            read({
                prompt: 'Port: '.green.bold,
                default: '65223'
            }, function (err, res) {
                if (err) {
                    console.log(err.message.red);
                    return resolve();
                }

                resolve(res);
            });
        }));

        if (!port) {
            console.log('Installation cancelled by user'.red);
            process.exit(1);
            return;
        }
    }

    var ssl = yield config.get('ssl');

    if (!ssl) {
        ssl = args.ssl || (yield new Promise (function (resolve, reject) {
            read({
                prompt: 'SSL folder: '.green.bold,
                default: 'leave empty to generate'
            }, function (err, res, isDefault) {
                if (err) {
                    console.log(err.message.red);
                    return resolve();
                }

                if (isDefault) {
                    var sslWorkingDir = path.resolve(__dirname, '../');
                    var sslProcess = child_process.spawn(path.resolve(sslWorkingDir, 'ssl.sh'), {
                            cwd: sslWorkingDir,
                            shell: 'bash',
                            stdio: 'inherit'
                        }
                    );

                    sslProcess.once('error', function (code) {
                        resolve();
                    });
                    sslProcess.once('exit', function (code) {
                        resolve(path.resolve(sslWorkingDir, '.ssl'));
                    });
                } else {
                    resolve(res);
                }
            });
        }));

        if (!ssl) {
            console.log('Installation cancelled by user'.red);
            process.exit(1);
            return;
        }
    }

    yield config.set('ssl', ssl);
    yield config.set('port', port);


    var secret = yield config.get('secret');

    if (!secret) {
        secret = tools.createToken();

        yield config.set('secret', secret);
    }

    if (!admin) {
        var jwt = new Jwt({
            secret: secret
        });

        var passwordHash = jwt.createHash(password);

        yield usersConfig.set(username, {
            passwordHash: passwordHash,
            admin: true
        });
    }

});
