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
var child_process = require('child_process');

var tools = require('./tools');

var blacklist = [
    'tredly console'
];


module.exports = function* (url, body, stream) {

    var commands = url
        .replace(/\s/g, '')
        .split('/');

    commands = _.compact(commands);
    commands.splice(1, 1);
    commands = commands.join(' ');

    var error = null;
    var template = commands.toLowerCase();

    _.forEach(blacklist, function (cmd) {
        if (template.indexOf(cmd) === 0) {
            error = error || 'Coommand "' + cmd + '" is not supported';
        }
    });

    if (error) {
        stream.write(tools.prepareText(error, { red: true, newLine: true }));
        return;
    }

    _.forEach(body, function (val, key) {
        commands += ' --' + key + (val ? ('="' + val + '"') : '');
    });

    yield new Promise(function (resolve, reject) {
        var result = child_process.exec('yes | ' + commands, {
                cwd: '/tmp',
                shell: 'bash',
                timeout: 60 * 60 * 1000,
                maxBuffer: 200 * 1024 * 1024
            }
        );

        result.stdout.pipe(stream);
        //result.stderr.pipe(stream);

        result.once('error', function (code) {
            resolve();
        });
        result.once('exit', function (code) {
            resolve();
        });
    });
};

