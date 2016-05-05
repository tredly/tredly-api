'use strict';

var _ = require('lodash');
var child_process = require('child_process');

var tools = require('./tools');

var blacklist = [
    'console'
];


module.exports = function* (url, body, stream) {

    var commands = url
        .replace(/\s/g, '')
        .replace(/^[\/]*tredly[\/]+v[0-9]*[\/]+/ig, '')
        .split('/');

    commands = _.compact(commands);
    commands = commands.join(' ');

    var error = null;
    var template = commands.toLowerCase();

    _.forEach(blacklist, function (cmd) {
        if (template.indexOf(cmd) === 0) {
            error = error || 'Command "tredly ' + cmd + '" is not supported';
        }
    });

    if (error) {
        stream.write(tools.prepareText(error, { red: true, newLine: true }));
        return;
    }

    commands = 'tredly ' + commands;

    _.forEach(body, function (val, key) {
        commands += ' --' + key + (val ? ('="' + val + '"') : '');
    });

    yield new Promise(function (resolve, reject) {
        var result = child_process.exec('yes | ' + commands, {
                cwd: '/tmp',
                shell: 'bash',
                timeout: 60 * 60 * 1000,
                maxBuffer: 200 * 1024 * 1024
            }
        );

        result.stdout.pipe(stream);
        //result.stderr.pipe(stream);

        result.once('error', function (code) {
            resolve();
        });
        result.once('exit', function (code) {
            resolve();
        });
    });
};
