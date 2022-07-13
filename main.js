'use strict';

const fs = require('fs');
const http = require('http');

const finalhandler = require('finalhandler');
const yaml = require('js-yaml');
const getopt = require('node-getopt');
const process = require('process');
const send = require('send');
const serveStatic = require('serve-static');

const evaluate = rules => (req, res, next) =>
	rules.reduceRight((acc, rule) => () => rule(req, res, acc), next)(req, res);

const httplet = rules => (req, res) =>
	evaluate(rules)(req, res, () => finalhandler(req, res)());

const ServeFile = (file, onError = []) => (req, res, next) => {
	const stream = send(req, file);
	stream.on('error', () => {
		evaluate(onError)(req, res, next);
	});
	stream.on('end', () => {
		next();
	});
	stream.pipe(res);
};

const ServeDirectory = (dir, onError = []) => (req, res, next) => {
	serveStatic(dir, {
		fallthrough: true,
		sent() { next() },
	})(req, res, () => evaluate(onError)(req, res, next));
}

const matchLocation = ({ prefix, exact, regexp }, url) => {
	const normalize = (url) => url === '' ? '/' : url;
	if (exact)
		return url === exact ? normalize('') : url;
	if (prefix)
		return url.startsWith(prefix) ? normalize(url.slice(prefix.length)) : url;
	if (regexp)
		return normalize(url.replace(new RegExp(regexp), ''));
	return url;
}

const EnterLocation = (location, rules) => (req, res, next) => {
	const url = matchLocation(location, req.url);
	if (url === req.url) {
		next();
		return;
	}
	const original = req.url;
	req.url = url;
	evaluate(rules)(req, res, () => {
		req.url = original;
		next();
	});
};

const AddHeaders = (headers) => (req, res, next) => {
	Object.entries(headers).forEach(([name, value]) => {
		res.setHeader(name, value);
	});
	next();
};

const Log = (msg) => (req, res, next) => {
	console.log(eval(`\`${msg}\``));
	next();
};

const Delay = (msec) => (req, res, next) => {
	setTimeout(next, msec);
};

Object.assign(exports, {
	httplet, evaluate,
	ServeFile, ServeDirectory, EnterLocation, AddHeaders, Log, Delay,
});

const jsonConfig = (config) =>
	config.map(({ rule, ...args }) => {
		switch (rule) {
		case 'Log':
			return Log(args.message);
		case 'Delay':
			return Delay(args.delay);
		case 'AddHeaders':
			return AddHeaders(args.headers);
		case 'ServeFile':
			return ServeFile(args.file, args.onError);
		case 'ServeDirectory':
			return ServeDirectory(args.dir, args.onError);
		case 'EnterLocation':
			return EnterLocation({ prefix: args.prefix, exact: args.exact, regexp: args.regexp }, jsonConfig(args.rules));
		default:
			throw `unknown rule: ${name}`;
		}
	});

if (require.main === module) {
	const opt = getopt.create([
		['p', 'port=ARG', 'port to listen (0=random, default 0)'],
		['b', 'bind=ARG', 'host to bind (default 0.0.0.0)'],
		['f', 'config-file=ARG', 'config file (JSON)'],
		['i', 'inline-config=ARG', 'inline config (JSON)'],
		['y', 'yaml-config=ARG', 'config file (YAML)'],
		['v', 'verbose', 'verbose mode'],
	])
	.bindHelp()
	.parseSystem();

	if (opt.argv.length > 0) {
		opt.showHelp();
		process.exit(1);
	}
	if (opt.options.f == null && opt.options.i == null && opt.options.y == null) {
		console.error('config not provided, try -h for help');
		process.exit(1);
	}
	if (opt.options.f != null && opt.options.i != null && opt.options.y != null) {
		console.error('too much configuration provided, try -h for help');
		process.exit(1);
	}
	const configData = opt.options.y ?
		yaml.load(fs.readFileSync(opt.options.y, 'utf-8')) :
		JSON.parse(opt.options.i || fs.readFileSync(opt.options.f, 'utf-8'));
	if (opt.options.v) {
		console.log('rules', JSON.stringify(configData, null, 2));
	}
	const config = jsonConfig(configData);

	const server = http.createServer((req, res) => {
		httplet(config)(req, res);
	});
	server.listen({
		port: opt.options.port ?? 0,
		host: opt.options.host ?? '0.0.0.0',
	}, () => {
		console.log(`listening at ${server.address().address}:${server.address().port}...`);
	});
}
