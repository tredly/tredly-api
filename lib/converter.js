'use strict';

var _ = require('lodash');
var stream = require('stream');

var tools = require('./tools');
var Table = require('./table');

module.exports = Converter;

function Converter (context, processor) {
    var self = this;

    self.context = context;
    self.processor = _.isFunction(processor) && processor;
    self.active = false;
    self.finished = false;
    self.resultStr = '';
    self.result = null;

    self.stream = self.context && self.context.res;

    if (!self.context || tools.acceptsJson(self.context) || self.processor) {
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

    custom = custom || !self.context;

    return yield new Promise(function (resolve, reject) {

        var convertResult = function () {
            try {
                var table = new Table();
                self.result = table.parse(self.resultStr);
                if (!custom) {
                    if (self.processor) {
                        self.processor(self.result);
                        if (tools.acceptsJson(self.context)) {
                            self.context.body = self.result;
                        } else {
                            self.context.body = table.format(self.result.data, self.result.metaData);
                        }
                        self.context.status = 200;
                    } else {
                        self.context.body = self.result;
                        self.context.status = 200;
                    }
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
