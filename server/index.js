'use strict';

var _ = require('lodash');
var co = require('co');
var koa = require('koa');
var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');
var KoaRouter = require('koa-router');
var koaCors = require('koa-cors');
var koaBody = require('koa-body');

var auth = require('./auth');
var push = require('./push');
var api = require('./api');
var Config = require('../lib/config');

process.on('uncaughtException', function (p) {
    console.log('Error: ', p);
    process.exit(1);
});
process.on('unhandledRejection', function (reason, p) {
    console.log('Error: ', p);
    process.exit(1);
});


co(function* () {

    var config = new Config();

    var app = koa();

    app.use(koaCors());
    app.use(koaBody());

    var router = new KoaRouter({
        prefix: '/tredly/v1'
    });

    auth(router);
    push(router);
    api(router);

    app
        .use(router.routes())
        .use(router.allowedMethods());

    var callback = app.callback();

    var server = null;

    var port = process.env.TREDLY_API_PORT || (yield config.get('port'));
    var ssl = process.env.TREDLY_API_SSL || (yield config.get('ssl'));

    if (!ssl) {
        port = port || 80;
        server = http.createServer(callback);
    } else {
        port = port || 443;

        var options = {
            key: fs.readFileSync(path.resolve(ssl, './server.key')),
            cert: fs.readFileSync(path.resolve(ssl, './server.crt'))
        };

        server = https.createServer(options, callback);
    }

    server.listen(port);

    server.timeout = 180 * 60 * 1000;

    console.log('Listening port - ', port);
});
