'use strict';

var _ = require('lodash');

var bash = require('./bash');
var tools = require('./tools');
var Table = require('./table');
var Converter = require('./converter');

var commandList = [
    {
        command: 'list partitions',
        verify: filterList({
            column: 'Partition',
            summary: ' partitions listed'
        })
    },
    {
        command: 'list containers',
        verify: filterList({
            column: 'Partition',
            summary: ' containers listed'
        })
    },
    {
        command: 'destroy container',
        verify: checkPartition({ checkContainer: true })
    },
    {
        command: 'destroy containers',
        verify: checkPartition({ checkId: true })
    },
    {
        command: 'create container',
        verify: checkPartition({ checkId: true, checkPath: true })
    },
    {
        command: 'replace container',
        verify: checkPartition({ checkId: true, checkPath: true })
    },
    {
        command: 'validate container',
        verify: checkPartition({ checkPath: true })
    },
    {
        command: 'push container',
        verify: checkPartition({ checkId: true, checkPath: true })
    },
    {
        command: 'push files',
        verify: checkPartition({ checkPath: true })
    }
];

module.exports = function* (user, url, body) {

    if (user.admin || !user.partitions || !user.partitions.length) {
        return true;
    }

    var command = tools.parseUrlPath(url);

    var commandInfo = _.find(commandList, function (commandInfo) {
        return command.indexOf(commandInfo.command) === 0;
    });

    if (!commandInfo) {
        return false;
    }

    return yield commandInfo.verify.call({
        user: user,
        command: command,
        body: body
    });
};

function checkPartition (options) {
    options = options || {};

    return function* () {
        var self = this;

        var result = true;
        var partition = null;
        var fullCommand = self.command.split(' ');
        var fullPath = self.body && self.body.path || '';
        fullPath = _.compact(fullPath.split('/'));

        if (options.checkId) {
            partition = fullCommand[fullCommand.length - 1];
            result &= (self.user.partitions.indexOf(partition) >= 0);
        }

        if (options.checkPath) {
            partition = fullPath[2];
            result &= (self.user.partitions.indexOf(partition) >= 0);
        }

        if (options.checkContainer) {
            var converter = new Converter();
            yield bash('/list/containers', {}, converter.stream);
            converter.stream.end();

            var containers = yield converter.waitForResult();
            var containerId = fullCommand[fullCommand.length - 1];
            result &= _.some(containers.data, function (container) {
                return container['UUID'] === containerId && self.user.partitions.indexOf(container['Partition']) >= 0;
            });
        }

        return result;
    }
}

function filterList (options) {
    options = options || {};

    return function* () {
        var self = this;
        return function (result) {
            var length = result.data.length;
            result.data =  _.filter(result.data, function (partition) {
                return self.user.partitions.indexOf(partition[options.column]) >= 0;
            });
            if (result.metaData && result.metaData.tableText) {
                result.metaData.tableText = result.metaData.tableText.replace(
                    new RegExp(length + options.summary, 'igm'),
                    result.data.length + options.summary
                    );
            }
        }
    };
}

