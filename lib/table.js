'use strict';

var _ = require('lodash');

module.exports = Table;

function Table (options) {
    this.options = _.defaults(options || {}, {
        globalCleanupRegex: /\u001b\[[0-9]+m/igm,
        cleanupRegex: /(^[\s]+|[\s]+$)/ig,
        tableRegex: /--------\n((?:(?!\n--------)[\s\S])*)/im,
        tablePrefix: '--------\n',
        tableSuffix: '',
        columnPrefix: '\u001b[1m',
        columnSuffix: '\u001b[22m',
        headerRegex: /((?:(?!\n)[\s\S])*)\n([\s\S]*)/im,
        colSepRegex: /\s\s(?=\S)/ig,
        colSepSize: 2,
        maxColSize: 30,
        rowSep: '\n'
    });
}

Table.prototype.parse = function (tableText) {
    var self = this;

    var str = tableText || '';
    str = str.replace(self.options.globalCleanupRegex, '');

    var table = self.options.tableRegex.exec(str);
    table = table[1] || '';

    table = self.options.headerRegex.exec(table);

    var cols = table[1] || '';
    cols = cols.split(self.options.colSepRegex);
    cols = cols.map(function (col) {
        return {
            name: col.replace(self.options.cleanupRegex, ''),
            size: col.length + self.options.colSepSize
        };
    });

    var rows = table[2] || '';
    rows = rows.split(self.options.rowSep);

    var data = [];

    rows.forEach(function (row) {
        var startIndex = 0, obj = {};

        cols.forEach(function (col, index) {
            var cell = '', endIndex = startIndex + col.size;
            if (index === (cols.length - 1)) {
                endIndex = row.length;
                col.size = Math.max(col.size, endIndex - startIndex);
            } else if (endIndex > row.length) {
                endIndex = row.length;
            }
            if (endIndex > startIndex) {
                cell = row.slice(startIndex, endIndex);
            }
            cell = cell.replace(self.options.cleanupRegex, '');
            obj[col.name] = cell;
            startIndex = endIndex;
        });

        data.push(obj);
    });

    var result = {
        metaData: {
            tableText: tableText,
            columns: cols
        },
        data: data
    };

    // Test formatting
    // result = self.format(result.data, result.metaData);

    return result;
};

Table.prototype.format = function (data, metaData) {
    var self = this;

    if (!data) {
        return '';
    }

    metaData = metaData || {};

    function formatCell (text, size) {
        text = (text || '').toString();
        if (size > text.length) {
            return text + new Array(size - text.length + 1).join(' ');
        } else {
            return text.slice(0, size);
        }
    }

    if (!metaData.columns) {
        var columns = {};
        data.forEach(function (row) {
            _.forEach(row, function (val, key) {
                columns[key] = Math.min(self.options.maxColSize,
                    Math.max(columns[key] || 0, (val || '').toString().length, key.length));
            });
        });
        metaData.columns = _.map(columns, function (size, name) {
            return { name: name, size: size + self.options.colSepSize };
        });
    }

    var resultTable = '';

    resultTable += self.options.columnPrefix;

    metaData.columns.forEach(function (col) {
        resultTable += formatCell(col.name, col.size);
    });

    resultTable += self.options.columnSuffix + '\n';

    data.forEach(function (row) {
        metaData.columns.forEach(function (col) {
            resultTable += formatCell(row[col.name], col.size);
        });
        resultTable += '\n';
    });

    if (metaData.tableText) {
        resultTable = metaData.tableText.replace(self.options.tableRegex,
            self.options.tablePrefix + resultTable + self.options.tableSuffix);
    }

    return resultTable;
};
