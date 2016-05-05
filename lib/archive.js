'use strict';

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var uuid = require('uuid');
var _ = require('lodash');
var async = require('async');
var tar = require('tar-stream');
var mkdirp = require('mkdirp');

var tools = require('./tools');

module.exports = Archive;

function Archive (log) {
    this.log = log;
}

Archive.prototype.allocateFile = function (filePath, callback) {
    var self = this;
    var dirName = path.dirname(filePath);

    async.waterfall([
        function (next) {
            mkdirp(dirName, next);
        },
        function (made, next) {
            fs.exists(filePath, next.bind(null, null));
        },
        function (exists, next) {
            if (!exists) {
                return next();
            }
            fs.unlink(filePath, next);
        }
    ], function (err) {
        if (err) {
            self.log.write(tools.prepareText('Cannot allocate file - ' + filePath + ', error -' + err.message, { red: true, newLine: true }));
            return callback(err);
        }

        //self.log.write(tools.prepareText('File allocated - ' + filePath, { green: true, newLine: true }));
        return callback(null, fs.createWriteStream(filePath));
    });
};

Archive.prototype.readFile = function (file, callback) {
    var self = this;
    var result = '';

    file.on('data', function (data) {
        result += data;
    });

    file.on('end', function (data) {
        result += data || '';
        callback(null, result);
    });

    file.on('error', function (err) {
        callback(err);
    });
};

Archive.prototype.extract = function* (stream, verify) {
    var self = this;

    return yield new Promise(function (resolve, reject) {
        var extract = tar.extract();
        var error = null;
        var apiConfig = null;

        var errText = 'Cannot transfer data: ';
        extract.on('entry', function (header, file, next) {
            if (!apiConfig) {
                if (header.name === '.tredlyapi') {
                    self.readFile(file, function (err, data) {
                        error = error || err;
                        if (data) {
                            try {
                                apiConfig = JSON.parse(data);

                                if (!apiConfig.path) {
                                    error = error || new Error('base directory is not specified');
                                } else if (apiConfig.path.toLowerCase().indexOf('/tredly/ptn/') !== 0) {
                                    error = error || new Error('base directory should start from "/tredly/ptn/"');
                                }

                                if (verify && !apiConfig.partition) {
                                    error = error || new Error('partition is not specified');
                                }
                            } catch (err) {
                                error = error || err;
                            }
                        }
                        if (error) {
                            errText += error.message;
                            self.log.write(tools.prepareText(errText, { red: true, newLine: true }));
                            resolve();
                        } else {
                            next();
                        }
                    });
                } else {
                    errText += 'base directory is not specified';
                    self.log.write(tools.prepareText(errText, { red: true, newLine: true }));
                    resolve();
                }
                return;
            }
            var filePath = path.join(apiConfig.path, header.name);
            file.on('end', function () {
                self.log.write(tools.prepareText('File transferred - ' + filePath, { green: true, newLine: true }));
                next();
            });

            file.on('error', function (err) {
                self.log.write(tools.prepareText('Cannot create file - ' + filePath + ', error -' + err.message, { red: true, newLine: true }));
                next();
            });

            file.pause();

            self.allocateFile(filePath, function (err, fileStream) {
                error = error || err;
                if (fileStream) {
                    file.pipe(fileStream);
                }
                file.resume();
            });
        });

        extract.on('finish', function() {
            resolve(!error && apiConfig);
        });

        extract.on('error', function(err) {
            error = error || err;
            errText += err.message;
            self.log.write(tools.prepareText(errText, { red: true, newLine: true }));
            resolve();
        });

        stream.pipe(zlib.createGunzip()).pipe(extract);
    });
};
