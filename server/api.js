'use strict';

var _ = require('lodash');
var tools = require('../lib/tools');
var bash = require('../lib/bash');
var access = require('../lib/access');
var Converter = require('../lib/converter');

module.exports = function (router) {

    router.post('/api/stdin', function* (next) {
        var self = this;

        var sessionId = getSessionId(self);
        var user = yield tools.getUser(this);

        var proc = bash.getProcess(sessionId);

        if (proc) {
            var input = (self.request.body || '').replace('\n', '');
            proc.process.stdin.write(input + '\n');
            if (input.toLowerCase() === 'exit' && proc.isWaiting) {
                proc.process.stdin.end();
            }
            proc.isWaiting = true;
        }

        self.status = 200;

    });

    router.post('/*', function* (next) {
        var self = this;

        var sessionId = getSessionId(self);

        var user = yield tools.getUser(this);
        var accessRes = yield access(user, self.request.url, self.request.body);

        if (!accessRes) {
            self.status = 401;
            return;
        }

        var converter = new Converter(self, accessRes);

        if (!converter.active) {
            sendFirstChunk(self);
        } else {
            self.status = 200;
        }

        yield bash(self.request.url, self.request.body, converter.stream, sessionId);

        converter.stream.end();

        yield converter.waitForResult();

    });
};

function sendFirstChunk (context) {
    context.res.setHeader('content-type', 'text/plain; charset=utf-8');
    context.res.setHeader('transfer-encoding', 'chunked');
    context.res.writeHead(200);

    var firstChunkSize = context.header['x-tredly-api-first-chunk-size'] &&
        parseInt(context.header['x-tredly-api-first-chunk-size']) || 0;

    if (firstChunkSize) {
        context.res.write(
            new Array(firstChunkSize).join(
                context.header['x-tredly-api-first-chunk-char'] || '\r'
            )
        );
    }
}

function getSessionId (context) {
    return context.header['x-tredly-api-session'];
}

