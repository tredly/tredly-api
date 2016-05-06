'use strict';

var _ = require('lodash');
var tools = require('../lib/tools');
var bash = require('../lib/bash');
var Converter = require('../lib/converter');

module.exports = function (router) {

    router.post('/*', function* (next) {
        var self = this;

        var converter = new Converter(self);

        self.status = 200;

        // validate security
        var user = yield tools.getUser(this);

        yield bash(self.request.url, self.request.body, converter.stream);

        converter.stream.end();

        yield converter.waitForResult();

    });
};
