'use strict';

const http = require('http');
const {
	httplet,
	AddHeaders, EnterLocation, ServeFile, ServeDirectory, Log
} = require('../main');

const CONFIG = [
	Log('${req.method} ${req.url}'),
	AddHeaders({ 'Content-Disposition': 'attachment' }),
	EnterLocation({ prefix: '/test' }, [
		ServeDirectory('public'),
	]),
];

const server = http.createServer(httplet(CONFIG));
server.listen(3004);
console.log("listening at 3004...");
