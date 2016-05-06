'use strict';

var _ = require('lodash');
var stream = require('stream');

var tools = require('./tools');
var Table = require('./table');

module.exports = Converter;

function Converter (context, template) {
    var self = this;

    self.context = context;
    self.active = false;
    self.finished = false;
    self.resultStr = '';
    self.result = null;

    self.stream = self.context.res;

    if (tools.acceptsJson(self.context)) {
        self.active = true;
        self.stream = new stream.Writable({
            write: function(chunk, encoding, next) {
                self.resultStr += chunk;
                next();
            }
        });

        self.stream.once('finish', function () {
            self.finished = true;
        });
    }
}

Converter.prototype.waitForResult = function* (custom) {
    var self = this;

    if (!self.active) {
        return;
    }

    return yield new Promise(function (resolve, reject) {

        var convertResult = function () {
            try {
                var table = new Table();
                self.result = table.parse(self.resultStr);
                if (!custom) {
                    self.context.body = self.result;
                    self.status = 200;
                }
                resolve(self.result);
            } catch (err) {
                reject(err);
            }
        }

        if (self.finished) {
            convertResult();
        } else {
            self.stream.once('finish', convertResult);
        }

        self.stream.once('error', function (err) {
            reject(err);
        });
    });
};
