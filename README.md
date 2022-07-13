# httplet

A simple HTTP server with clear semantics.

## Configuration

Configuration is a sequence of rules.
If serving rule does not occur within a sequence, it returns 404.
There should be at most one serving rule in a sequence.
After a serving rule occurs, the response is already sent.

Serving rule also has an error branch called `onError` (typically when resource is not found).
In case of error, the error branch is executed and then the rule ends processing.
Error branches allow for conditional processing.

There is a special rule `EnterLocation` that allows to branch URLs.
`EnterLocation` strips matched parts from the URL, allowing to create URL hierarchy without configuration redundancy.

## Rules

- `ServeFile` - serves a file
  * `file` - file to be served
  * `onError` - error sequence
- `ServeDirectory` - serves files from a directory
  * `dir` - directory to be served
  * `onError` - error sequence
- `AddHeaders` - add response headers
  * `headers` - headers to add
- `Log` - log a message to stdout
  * `message` - message to log, can interpolate `req` and `res` objects
- `Delay` - wait (simulate network latency? reproduce race condition?)
  * `delay` - period to wait (ms)
- `EnterLocation` - branch a (sub)location using given matching strategy
  - matching is defined by one of:
    * `prefix` - URL prefix to match (to implement location)
    * `exact` - URL to match exatcly (to implement endpoint)
    * `regexp` - regular expression to match URL
  * `rules` - matching sequence

## Execution

Configuration can be provided as JavaScript, JSON or YAML.
syntax:
```
node main.js [options] -f json-config-file
node main.js [options] -i inline-json-config
node main.js [options] -y yaml-config-file

options: -p port | -b bind-address | -v
help: -h
```

## Examples

### JSON

Serve directory `public` under `/test/*` URL.
Log requests matching location.

```
[
	{ "rule": "EnterLocation", "prefix": "/test", "rules": [
		{ "rule": "Log", "message": "${req.method} ${req.url}" },
		{ "rule": "ServeDirectory", "dir": "public" }
	]}
]
```

### YAML

Serve file `public/index.txt` at `/index` URL.
Log all requests.

```
- rule: Log
  message: "${req.method} ${req.url}"
- rule: EnterLocation
  exact: "/index"
  rules:
  - rule: ServeFile
    file: public/index.txt
```

### inline JSON

Serve directory `public` at `/*` URL.

```
node main.js -p 3003 -i "[{\"rule\": \"ServeDirectory\", \"dir\": \"public\"}]" -v
```

### JavaScript

Serve directory `public` at `/test/*` URL.
Files will be served as attachments.
Log all requests.

```
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
```

## TODO list

- prepare NPM package
- example for creating custom rules
- powerful conditional rule
- proxy rule
