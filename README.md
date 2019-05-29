# n3-sql
Singleton wrapper for node mysql

Usage:
```
// Call getInstance() first using the database config
const db = require(base_dir+'/helpers/db').getInstance(config);

// Than simply require db wherever you need it:
const db = require(base_dir+'/helpers/db').getInstance();
```
