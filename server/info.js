'use strict';

var _ = require('lodash');
var os = require('os');

var tools = require('../lib/tools');

module.exports = function (router) {

    router.post('/view/info', function* (next) {
        var self = this;

        var user = yield tools.getUser(self);

        var result = {
            data: [
                {
                    Uptime: os.uptime(),
                    ApiVersion: process.env.npm_package_version
                }
            ]
        };

        if (!tools.acceptsJson(self)) {
            result = tools.formatTable(result.data, {
                title: 'Host Information'
            });
        }

        self.body = result;
        self.status = 200;
    });
};
