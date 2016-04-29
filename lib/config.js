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

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var async = require('async');

module.exports = Config;

function Config (name) {
    this.name = name || 'config';
    this.path = path.resolve(__dirname, '../.' + this.name);
    this.config = null;
}

Config.prototype.init = function* () {
    var self = this;

    if (self.config) {
        return;
    }
    return yield new Promise (function (resolve, reject) {
        async.waterfall([
            function (next) {
                fs.exists(self.path, next.bind(null, null));
            },
            function (exists, next) {
                if (!exists) {
                    return next();
                }
                fs.readFile(self.path, next);
            }
        ], function (err, file) {
            self.config = {};

            if (err) {
                console.log(err);
                return reject(new Error('Cannot read config file - ' + self.name));
            }

            try {
                if (file) {
                    self.config = JSON.parse(file);
                }
            } catch (err) {
                console.log(err);
                return reject(new Error('Cannot parse config file - ' + self.name));
            }

            resolve();
        });
    });
};

Config.prototype.get = function* (key) {
    yield this.init();

    return this.config[key];
};

Config.prototype.set = function* (key, value) {
    yield this.init();

    if (_.isUndefined(value) || _.isNull(value)) {
        delete this.config[key];
    } else {
        this.config[key] = value;
    }

    yield this.save();
};

Config.prototype.list = function* () {
    yield this.init();

    return _.clone(this.config);
};

Config.prototype.save = function* () {
    var self = this;

    if (!self.config) {
        return;
    }

    return yield new Promise (function (resolve, reject) {
        fs.writeFile(self.path, JSON.stringify(self.config, null, '    '), function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};
