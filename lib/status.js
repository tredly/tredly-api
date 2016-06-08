'use strict';

var co = require('co');
var _ = require('lodash');
var Config = require('./config');

var config = new Config();

var pid = null;
var port = null;

co(function* () {
    port = yield config.get('port');
    port = port || 0;
    write();
});

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function () {
    var chunk = process.stdin.read();
    if (chunk !== null) {
        write(chunk);
    }
});

process.stdin.on('end', function () {
    pid = pid || 0;
    write();
});

function write (chunk) {
    if (_.isString(chunk)) {
        prepare(chunk);
    } else {
        if (port !== null && pid !== null) {
            if (!pid) {
                process.stdout.write('Tredly API is not running.\n');
            } else {
                process.stdout.write('Tredly API is running as pid ' + pid + ' and listening port ' + port + '.\n');
            }
        }
    }
}

function prepare (chunk) {
    var chunks = chunk.split(/[\s]+/ig);
    var prevChunk = null;
    _.forEach(chunks, function (chunk) {
        if (!pid && chunk.indexOf('/.forever/tredly-api.log') >= 0) {
            pid = parseInt(prevChunk);
        }
        prevChunk = chunk;
    });
}

