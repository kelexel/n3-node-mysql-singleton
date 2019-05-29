# n3-sql
A simple singleton wrapper to node mysql

Purpose:

* Make a database connection reusable across all my code basically, by wrapping a mysql connection, or pool, in a singleton.
* Give the possibility to use database pooling, and if so, acquire and release a connection as fast as possible from the pool (FIFO style).
* Otherwise fallback to regular node mysql

Usage:

First, call getInstance() using the database config:
```
const conf = {
  host     : '1.2.3.4',
  port      : '3306',
  user     : 'myUser',
  password : 'myPass',
  database : 'myDb',
  pool: true, // true if you want to use pools
  connectionLimit: 100 // you can add any other node mysql settings here.
}

const db = require('n3-sql').getInstance(config);
```

```
// Than simply require db whenever, and wherever you need it:
const db = require('n3-sql').getInstance();
db.query(...);
```

Note & disclaimer:
* This was designed to fit specific needs (mine). You will probably need to modify it, so feel free to fork and improve it, or to consider it as a simple exercise.
* My workflow implies identifying nodes that generate logs using what I refer to as a CID, thus the "OK CID XXX" strings in the code. I'm thinking about adding onLogOk, onLogError, onLogWarning events to let you customize this.
* The wrapper only wraps around pool.query, the rest is just cosmetics around node mysql.
* I decided to use `debug` as my CLI logging engine, therefore, you can pass DEBUG=n3-sql as environment variable to get verbose output of pool activities.
* I wish someone could write a few sample tests for this wrapper.
* As always, use at your own risk.
