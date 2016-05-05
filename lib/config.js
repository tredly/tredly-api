'use strict';

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
