'use strict';

var _ = require('lodash');
var tools = require('./tools');
var bash = require('./bash');

module.exports = function (router) {

    router.post('/*', function* (next) {
        var self = this;

        self.status = 200;

        // validate security
        var user = yield tools.getUser(this);

        yield bash(self.request.url, self.request.body, self.res);

        self.res.end();

    });
};
