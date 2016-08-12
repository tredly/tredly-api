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
    var yesCommand = true;

    _.forEach(blackList, function (cmd) {
        if (template.indexOf(cmd) === 0) {
            error = error || 'Command "tredly ' + cmd + '" is not supported';
        }
    });

    _.forEach(interactiveList, function (cmd) {
        if (template.indexOf(cmd) === 0) {
            yesCommand = false;
        }
    });

    if (error) {
        stream.write(tools.prepareText(error, { red: true, newLine: true }));
        return;
    }

    // split out the commands so we can push onto this array
    var cmdArray = commands.split(' ');

    _.forEach(body, function (val, key) {
        cmdArray.push('--' + key + (val ? ('=' + val) : ''));
    });

    commands = commands.split(' ');

    yield new Promise(function (resolve, reject) {
        var result = child_process.spawn('tredly', cmdArray, {
                cwd: '/tmp',
                shell: 'bash'
            }
        );

        registerProcess(sessionId, result);

        result.stdout.on('data', function (data) {
            stream.write(data);
        });
        result.stderr.on('data', function (data) {
            stream.write(data);
        });

        var sendYes = yesCommand ? setInterval(function () {
            result.stdin.write('y\n');
        }, 1000) : null;

        var stop = function (kill) {
            if (sendYes) {
                clearInterval(sendYes);
                sendYes = null;
            }

            if (kill) {
                result.kill();
            }

            resolve();
        };

        //result.stdout.pipe(stream);
        //result.stderr.pipe(stream);

        stream.once('error', function (code) {
            stop(true);
        });
        stream.once('close', function (code) {
            stop(true);
        });
        result.once('error', function (code) {
            stop();
        });
        result.once('exit', function (code) {
            stop();
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
