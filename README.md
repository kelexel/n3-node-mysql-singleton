# n3-sql
A simple singleton wrapper to node mysql

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

Note:
* My workflow implies identifying nodes that generate logs using what I refer to as a CID, thus the "OK CID XXX" strings in the code. I'm thinking about adding onLogOk, onLogError, onLogWarning events to let you customize this.
* The wrapper only wraps around pool.query, the rest is just cosmetics around node mysql.
