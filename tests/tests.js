'use strict';

const http = require('http');
const {
	httplet,
	AddHeaders, EnterLocation, ServeFile, ServeDirectory, Log
} = require('../main');

const CONFIG = [
	AddHeaders({ 'Content-Disposition': 'inline' }),
	EnterLocation({ exact: '/1' }, [
		Log('+ enter /1'),
		Log('> ${req.method} ${req.url} ${res.headersSent}'),
		ServeFile('public/hi.txt'),
		Log('< ${req.method} ${req.url} ${res.headersSent}'),
	]),
	EnterLocation({ exact: '/2' }, [
		Log('+ enter /2'),
		Log('> ${req.method} ${req.url} ${res.headersSent}'),
		ServeFile('public/qq.txt'),
		Log('< ${req.method} ${req.url} ${res.headersSent}'),
	]),
	EnterLocation({ exact: '/3' }, [
		Log('+ enter /3'),
		Log('> ${req.method} ${req.url} ${res.headersSent}'),
		ServeFile('public/hi.txt', [Log('- err'), ServeFile('public/index.txt')]),
		Log('< ${req.method} ${req.url} ${res.headersSent}'),
	]),
	EnterLocation({ exact: '/4' }, [
		Log('+ enter /4'),
		Log('> ${req.method} ${req.url} ${res.headersSent}'),
		ServeFile('public/qq.txt', [Log('- err'), ServeFile('public/index.txt')]),
		Log('< ${req.method} ${req.url} ${res.headersSent}'),
	]),
	EnterLocation({ prefix: '/5' }, [
		Log('+ enter /5'),
		Log('> ${req.method} ${req.url} ${res.headersSent}'),
		ServeDirectory('public'),
		Log('< ${req.method} ${req.url} ${res.headersSent}'),
	]),
	EnterLocation({ prefix: '/6' }, [
		Log('+ enter /6'),
		Log('> ${req.method} ${req.url} ${res.headersSent}'),
		ServeDirectory('public', [Log('- err'), ServeFile('public/index.txt')]),
		Log('> ${req.method} ${req.url} ${res.headersSent}'),
	]),
	EnterLocation({ prefix: '/7' }, [
		Log('+ enter /7'),
		Log('> ${req.method} ${req.url} ${res.headersSent}'),
		ServeDirectory('public', [Log('- err'), ServeDirectory('..', [Log('- err2')])]),
		Log('> ${req.method} ${req.url} ${res.headersSent}'),
	]),
	Log('* end'),
];

const server = http.createServer(httplet(CONFIG));
server.listen(3000);
console.log("listening at 3000...");

/*

http://localhost:3000/1
http://localhost:3000/2
http://localhost:3000/3
http://localhost:3000/4
http://localhost:3000/5/hi.txt
http://localhost:3000/5/zzz
http://localhost:3000/6/hi.txt
http://localhost:3000/6/zzz
http://localhost:3000/7/hi.txt
http://localhost:3000/7/notes.txt
http://localhost:3000/7/zzz

*/
