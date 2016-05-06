'use strict';

var _ = require('lodash');
var fs = require('fs');

var bash = require('../lib/bash');
var tools = require('../lib/tools');
var Archive = require('../lib/archive');

module.exports = function (router) {

    router.post('/push/container', function* (next) {
        var self = this;

        var config = yield pushFiles(this, true);

        if (config) {
            var partition = config.partition;
            delete config.partition;

            yield bash('/replace/container/' + partition, config, self.res);
        }

        self.res.end();

    });

    router.post('/push/files', function* (next) {

        yield pushFiles(this);

        this.res.end();

    });
};

function* pushFiles (context, verify) {
    context.status = 200;

    var archive = new Archive(context.res);

    // validate security
    var user = yield tools.getUser(context);

    return yield archive.extract(context.req, verify);

}
