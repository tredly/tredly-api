'use strict';

//////////////////////////////////////////////////////////////////////////
// Copyright 2016 Vuid Pty Ltd
// https://www.vuid.com
//
// This file is part of tredly-api.
//
// tredly-api is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// tredly-api is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with tredly-api.  If not, see <http://www.gnu.org/licenses/>.
//////////////////////////////////////////////////////////////////////////

var _ = require('lodash');
var fs = require('fs');

var bash = require('./bash');
var tools = require('./tools');
var Archive = require('./archive');

module.exports = function (router) {

    router.post('/push/container', function* (next) {
        var self = this;

        self.status = 200;

        var archive = new Archive(self.res);

        // validate security
        var user = yield tools.getUser(this);

        var config = yield archive.extract(self.req);

        if (config) {
            var partition = config.partition;
            delete config.partition;

            yield bash('/tredly/v1/replace/container/' + partition, config, self.res);
        }

        self.res.end();

    });
};

