# n3-node-mysql-singleton
A simple singleton wrapper to node mysql

## Purpose:

* Make a database connection reusable across all my code basically, by wrapping a mysql connection, or pool, in a singleton.
* Give the possibility to use database pooling, and if so, acquire and release a connection as fast as possible from the pool (FIFO style).
* Give the ability to re-use the same pool connection without re-querying the pool, or, allow one-use-only connections.
* Otherwise fallback to regular node mysql.

## Usage:

First, call getInstance() using the database config:
```
// app.js
const conf = {
  host     : '1.2.3.4',
  port      : '3306',
  user     : 'myUser',
  password : 'myPass',
  database : 'myDb',
  pool: true, // true if you want to use pools
  connectionLimit: 100 // you can add any other node mysql settings here.
}

const db = require('n3-node-mysql-singleton').getInstance(config);
```

Than simply require db whenever, and wherever you need it:
```
// mySuperAppModule.js
const db = require('n3-node-mysql-singleton').getInstance();
db.query(...);
```


## Extra Flavors

#### Keeping pool connections alive
I added a fourth boolean argument to db.query: `keepAlive`.
If set to true, the pool connection won't get released, so you can re-use the previous pool connection in your next query.
```
const db = require('n3-node-mysql-singleton').getInstance();
db.query(sql, values, (error, results, fields) => {
  if (err) { /* ... */ }
  db.query(sql2, values2, (error2, results2, fields2) => {
    ...
    }, true);
}, true);
```
#### Acquiring and Releasing pool connections
If using pool connections, you can force acquiring or releasing a connection at any time by using:
```
let myCon;
db.acquire((connection) => {
  myCon = connection;
});
...
myCon.release();
or
db.release();
```

#### Events
You can pass references for the following pool events: `onPoolAquire`, `onPoolRelease`, `onPoolConnection` in your config definition.

#### Logging
You can pass `logOkPrefix` and `logErrorPrefix` strings in your config definition, therefore you could do something like:
```
const prefix = process.env.NODE_ENV ? process.env.NODE_ENV+'-' : '';
const dbconfig = require('etc/'+prefix+'db-conf.js');

const cid = process.env.NODE_ID !== undefined ? process.env.NODE_ID : 0;
dbconfig.logOkPrefix = 'OK CID '+cid+' | ';
dbconfig.logErrorPrefix = 'Error CID '+cid+' | ';

const db = require('n3-node-mysql-singleton').getInstance(dbconfig);

const app = require('./app.js');
...

```

### Escaping
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
* The wrapper only wraps around pool.query, the rest is just cosmetics around node mysql.
* I decided to use `debug` as my CLI logging engine, therefore, you can pass DEBUG=n3-sql as environment variable to get verbose output of pool activities.
* I wish someone could write a few sample tests for this wrapper.
* As always, use at your own risk.

## Todo
* Write tests
* Make it optionally return Promises
