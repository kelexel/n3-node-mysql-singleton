# n3-node-mysql-singleton
A simple singleton wrapper to node mysql

## Purpose:

* Make a database connection reusable across all your code by wrapping a mysql connection (or pool connection), in a re-usable singleton.
* Have the ability to connect to different databases, each db instance being it's own singleton.
* Give the possibility to use database pooling, and the ability to re-use the same pool connection without re-querying the pool, or, allow one-use-only connections (FIFO style).

## Changelog:
* 1.2.0: New multi db support, simplified code...
* 1.1.2: Releasing a pool connection is now done in the query callback
* 1.1.1: Fixed npm publishing issue...
* 1.1.0: Added some documentation to the code
* 1.0.9: Removed logger dependency, the ligrary now supports `log` boolean and `onLog`callback
* 1.0.8: Added my own logger
* 1.0.7: Cleaner Class, added .jshintrc
* 1.0.6: Rewritten as a Class, but not fully tested - yet.

## Usage:

First, call getInstance() using the database config:
```
// app.js
const config = {
  host     : '1.2.3.4',
  port      : '3306',
  user     : 'myUser',
  password : 'myPass',
  database : 'myDb',
  pool: true, // true if you want to use pools
  connectionLimit: 100 // you can add any other node mysql settings here.
}
const label = 'default';

const db = require('n3-node-mysql-singleton').getInstance(config, label);
```

Than simply require db whenever, and wherever you need it:
```
// mySuperAppModule.js
const label = 'default';
const db = require('n3-node-mysql-singleton').getInstance(label);
db.query(...);
```

Note, you can drop the `label` if your are only connecting to a unique database.



#### Pool methods:
```
// Acquire a (new or existing) connection from the pool
db.acquire((poolConnection) => {
  // This means you can reuse the connection several times...
  const foo = poolConnection.escape('bar');
  // But do not forget to release it!
  poolConnection.release();
  ...
});


// Make a query with a single use poolConnection
db.query(sql, values, (error, results, fields) => {
  ...
});


// When making a query, if using keepAlive, the pool connection will not be released, making it easy to chain several queries in a row, without acquiring/releasing a poolConnection each time.
db.query(sql, values, (error, results, fields) => {
  ...
  // Just do not forget to release poolConnections when done using db this time !!
  db.release();
}, true);
```

#### Single connection methods:
```
// Escape a value
const escapedVal = db.escape('hello');

// Make a query
db.query(sql, values, (error, results, fields) => {
  ...
});
```

#### Keeping pool connections alive
I added a fourth boolean argument to db.query: `keepAlive`.
If set to true, the pool connection won't get released, so you can re-use the previous pool connection in your next query.
```
const db = require('n3-node-mysql-singleton').getInstance();
db.query(sql, values, (error, results, fields) => {
  if (err) { /* ... */ }
  db.query(sql2, values2, (error2, results2, fields2) => {
    ...
    db.release();
    ...
    }, true);
}, true);
```

#### Events
You can pass method references for the following pool events: `onPoolAquire`, `onPoolRelease`, `onPoolConnection` in your config definition.
You can also pass references for `onLog` event (see *Logging*)

#### Logging
This library can now use *any* logging facility, or fall back to `console` as default

```
// app.js
const dbconfig = require('etc/'+prefix+'db-conf.js');

// turn logging on
dbconfig.log = true
const db = require('n3-node-mysql-singleton').getInstance(dbconfig);
```

Optionally pass a callback, otherwise, the library will use simply console.log(status, message)...
```
const dbconfig = require('etc/'+prefix+'db-conf.js');

// set a custom logger
const debugDb = require('debug')('db')

// set a custom onLog event
dbconfig.onLog = (status, message) => {
  // Here you can use any logging facility you want, ie debug:
  if (status == 'ok') debug('ok: '+message);
  else ...
}

// than create your db instance
const db = require('n3-node-mysql-singleton').getInstance(dbconfig);
```

#### Escaping
If using pool connections, and `keepAlive`, escaping will re-use the existing pool connection.
```
const str = 'hello world';
const escapedStr = db.escape(str);
console.log(escapedStr);
```
If no connection exists, *you must* supply a callback to *pool.escape* (because acquiring a new pool connection is asynchronous)
```
const str = 'hello world';
db.escape(str, (escapedStr) => {
  console.log(escapedStr);
});
```

## Notes & disclaimers:
* This was designed to fit specific needs (mine). You will probably need to modify it, so feel free to fork and improve it (but please, make a PR).
* The wrapper only wraps around \*.query, and \*.escape the rest is just cosmetics around node mysql.
* I wish someone could write a few sample tests for this wrapper.
* As always, use at your own risk.

## Todo
* Write tests
* Correct my spelling
* Make it optionally return Promises, or... not?
