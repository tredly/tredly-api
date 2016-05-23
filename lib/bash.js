'use strict';

var _ = require('lodash');
var child_process = require('child_process');

var tools = require('./tools');

var blackList = [

];

var interactiveList = [
    'console'
];

var processes = {};

module.exports = function* (url, body, stream, sessionId) {

    var commands = tools.parseUrlPath(url);

    var error = null;
    var template = commands.toLowerCase();
    var yesCommand = 'yes | ';

    _.forEach(blackList, function (cmd) {
        if (template.indexOf(cmd) === 0) {
            error = error || 'Command "tredly ' + cmd + '" is not supported';
        }
    });

    _.forEach(interactiveList, function (cmd) {
        if (template.indexOf(cmd) === 0) {
            yesCommand = '';
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
        var result = child_process.spawn(yesCommand + commands, {
                cwd: '/tmp',
                shell: 'bash'
            }
        );

        registerProcess(sessionId, result);

        result.stdout.pipe(stream);
        //result.stderr.pipe(stream);

        stream.once('error', function (code) {
            result.kill();
            resolve();
        });
        stream.once('close', function (code) {
            result.kill();
            resolve();
        });
        result.once('error', function (code) {
            resolve();
        });
        result.once('exit', function (code) {
            resolve();
        });
    });
};

module.exports.getProcess = function (sessionId) {
    if (!sessionId) {
        return null;
    }
    return processes[sessionId];
}

function registerProcess (sessionId, proc) {
    if (!sessionId || !proc) {
        return;
    }

    processes[sessionId] = {
        process: proc,
        listener: function (data) {
            if (processes[sessionId].process === proc) {
                processes[sessionId].isWaiting = false;
            }
        },
        isWaiting: false
    };

    proc.stdout.addListener('data', processes[sessionId].listener);

    proc.once('error', function (code) {
        unregisterProcess(sessionId, proc);
    });
    proc.once('exit', function (code) {
        unregisterProcess(sessionId, proc);
    });
}

function unregisterProcess (sessionId, proc) {
    if (sessionId && processes[sessionId] && processes[sessionId].process === proc) {
        proc.stdout.removeListener('data', processes[sessionId].listener);
        delete processes[sessionId];
    }
}

