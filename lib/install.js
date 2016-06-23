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
    var admin = null;
    _.forEach(users, function (user, name) {
        if (user.admin) {
            admin = _.extend({
                name: name
            }, user);
        }
    });

    var username = null;
    var password = null;

    if (!admin || args.interactive) {
        username = args.username || (yield new Promise (function (resolve, reject) {
            read({
                prompt: 'Admin user name: '.green.bold,
                default: admin && admin.name || ''
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

        password = args.password || (args.password === '') || (yield new Promise (function (resolve, reject) {
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
        } else if (password === true) {
            password = tools.createToken(10);
            console.log(password);
        } else if (password === args.password) {
            console.log(password);
        }
    }

    if (!args.credentials) {
        var port = yield config.get('port');

        if (!port || args.interactive) {
            port = args.port || (yield new Promise (function (resolve, reject) {
                read({
                    prompt: 'Port: '.green.bold,
                    default: port || '65223'
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

        if (!ssl || args.interactive) {
            ssl = args.ssl || (yield new Promise (function (resolve, reject) {
                read({
                    prompt: 'SSL folder: '.green.bold,
                    default: ssl || 'leave empty to generate'
                }, function (err, res, isDefault) {
                    if (err) {
                        console.log(err.message.red);
                        return resolve();
                    }

                    if (isDefault && res !== ssl) {
                        generateSsl('inherit').then(resolve);
                    } else {
                        resolve(res);
                    }
                });
            }));

            if (!ssl) {
                console.log('Installation cancelled by user'.red);
                process.exit(1);
                return;
            } else if (ssl === true) {
                ssl = yield generateSsl('ignore');
            }
        }

        yield config.set('ssl', ssl);
        yield config.set('port', port);
    }


    var secret = yield config.get('secret');

    if (!secret) {
        secret = tools.createToken();

        yield config.set('secret', secret);
    }

    if (!admin || args.interactive) {
        var jwt = new Jwt({
            secret: secret
        });

        var passwordHash = jwt.createHash(password);

        if (admin && admin.name !== username) {
            yield usersConfig.set(admin.name);
        }

        yield usersConfig.set(username, {
            passwordHash: passwordHash,
            admin: true
        });
    }

});

function generateSsl (stdio) {
    return new Promise (function (resolve, reject) {
        var sslWorkingDir = path.resolve(__dirname, '../');
        var sslProcess = child_process.spawn(path.resolve(sslWorkingDir, 'ssl.sh'), {
                cwd: sslWorkingDir,
                shell: 'bash',
                stdio: stdio
            }
        );

        sslProcess.once('error', function (code) {
            resolve();
        });
        sslProcess.once('exit', function (code) {
            resolve(path.resolve(sslWorkingDir, '.ssl'));
        });
    });
}
