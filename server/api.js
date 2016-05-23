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

        self.status = 200;

        var converter = new Converter(self, accessRes);

        yield bash(self.request.url, self.request.body, converter.stream, sessionId);

        converter.stream.end();

        yield converter.waitForResult();

    });
};

function getSessionId (context) {
    return context.header['x-tredly-api-session'];
}

