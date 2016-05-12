'use strict';

var _ = require('lodash');
var tools = require('../lib/tools');
var bash = require('../lib/bash');
var access = require('../lib/access');
var Converter = require('../lib/converter');

module.exports = function (router) {

    router.post('/*', function* (next) {
        var self = this;

        var user = yield tools.getUser(this);
        var accessRes = yield access(user, self.request.url, self.request.body);

        if (!accessRes) {
            self.status = 401;
            return;
        }

        self.status = 200;

        var converter = new Converter(self, accessRes);

        yield bash(self.request.url, self.request.body, converter.stream);

        converter.stream.end();

        yield converter.waitForResult();

    });
};
