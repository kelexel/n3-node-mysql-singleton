/*
 n3-node-mysql-singleton

 A simple singleton wrapper to node mysql

 author: Rudolph Sand (kelexel)
 licence: MIT

 For more information about node mysql and pooling (extra settings, events), please read the docs at: https://github.com/mysqljs/mysql#pooling-connections
*/

(function () {
  'use strict';
}());

const mysql = require('mysql');

// Only for testing purposes, leave false otherwise
const forceKeepAlive = true;

// Used to store our object instance
let _instance;
// // Used to store our last connection obtained from the pool
// let _connection = false;
// Used as a logging shim
let _logger = {};

class NodeMysqlSingleton {

  constructor(config) {
    // Store logging settings
    this._config = {
      log: config.log,
      onLog: config.onLog
    };

    // Assign a log method to our logger shim, since it's bound to our object, the method scope will have access to this._config
    _logger.log = this._log.bind(this);

    // Reset the pool placeholder
    this.pool = false;

    // Decide if we want to create a pool, or a single database connection
    if (config.pool === true)
    this._createPool(config);
    else
    this._createConnection(config);
  }

  acquire(callback) {
    // // If we are in pool mode, and already have acquired a connection, return it.
    // if (_connection !== false && this.pool !== false) {
    //   if (callback)
    //   return callback(_connection);
    // } else {
      // Aquire a connection from the pool
      this.pool.getConnection((err, poolConnection) => {
        if (err) {
          console.log('error', err);
          return;
        }
        // _logger.log('ok', 'New poolConnection '+ poolConnection.threadId);
        // Memoize the connection as _connection for later reuse
        // _connection = poolConnection;
        // And return it if a callback was supplied as argument
        if (callback) callback(poolConnection);
      });
    // }
  }

  // escape(str, callback) {
  //   // If we are in pool mode
  //   if (this.pool !== false) {
  //     // And a connection exists, use it to escape the value, otherwise, return false.
  //     return _connection !== false ? _connection.escape(str) : false;
  //   }
  //   // If no callback is supplied, warn the user...
  //   if (!callback) {
  //     _logger.log('error', 'No escape callback providden, cannot return escaped value!');
  //     return;
  //   }
  //   // Acquire a connection, and use it to return the escaped value via the callback
  //   this.acquire((poolConnection) => {
  //     callback(poolConnection.escape(str));
  //   });
  // }

  // release() {
  //   // If we are in pool mode and a connection exists, release it.
  //   // if (this.pool !== false && _connection !== false)
  //   // return _connection.release();
  //   this.acquire((poolConnection) => {
  //     poolConnection.release();
  //   });
  // }

  query(sql, values, cb, keepAlive) {
    // If we are NOT in pool mode, use the existing (single) connection to perform the query
    if (this.pool === false) {
      return _connection !== false ? _connection.query(sql, values, cb) : false;
    }
      // this.pool.query(sql, values, (error, results, fields) => {
      //   // if (keepAlive !== true && forceKeepAlive !== true) {
      //   //   _connection.release();
      //   //   console.log(_connection)
      //   //   // _connection = false;
      //   // }
      //   cb(error, results, fields);
      // });


      this.acquire((connection) => {
        connection.query(sql, values, (error, results, fields) => {
          if (keepAlive !== true && forceKeepAlive !== true) {
            connection.release();
          }
          cb(error, results, fields);
        });
      });
    // // Otherwise, we are in pool mode, so check if a _connection exists, and if so, perform the query using it.
    // if (_connection !== false) {
    //   _logger.log('ok', 'Using previous poolConnection ' + _connection.threadId);
    //   _connection.query(sql, values, (error, results, fields) => {
    //     if (keepAlive !== true && forceKeepAlive !== true) {
    //       _connection.release();
    //       console.log(_connection)
    //       // _connection = false;
    //     }
    //     cb(error, results, fields);
    //   });
    // } else {
    //   // Or if no _connection exists, create one, than execute the query
    //   this.acquire(() => {
    //     _connection.query(sql, values, (error, results, fields) => {
    //       if (keepAlive !== true && forceKeepAlive !== true) {
    //         // _connection.release();
    //         // _connection = false;
    //       }
    //       cb(error, results, fields);
    //     });
    //     // And release it if keepAlive is not providden
    //   });
    // }
  }

  _log(status, message) {
    // If logging is turned off, simply return
    if (!this._config.log) return;
    // If logging is turned on, and an onLog method was supplied, run it
    if (this._config.onLog) this._config.onLog(status, message);
    else
    // Otherwise, use console.log to report the status and message
    console.log(status, message);
  }

  _createPool(config) {
    // Create a database pool
    this.pool = mysql.createPool(config);

    // Set acquire pool event
    if (config.onPoolAcquire)
    this.pool.on('acquire', config.onPoolAcquire);

    // Set connection pool event
    if (config.onPoolConnection)
    this.pool.on('connection', config.onPoolConnection);

    // Set release pool event
    if (config.onPoolEnqueue)
    this.pool.on('connection', config.onPoolEnqueue);
    else {
      // Set a default release event, usefull for testing keepAlive...
      this.pool.on('enqueue', () => {
        _logger.log('error', 'Pool enqued!');
      });
    }
    // Set release pool event
    if (config.onPoolRelease)
    this.pool.on('connection', config.onPoolRelease);

    _logger.log('ok', 'Pool DB created!');

  }

  _createConnection(config) {
    // Create a regular db connection
    const connection = mysql.createConnection(config);
    connection.connect((err) => {
      if (err) {
        _logger.log('error', 'Cannot connect to DB!');
        console.error('error connecting: ' + err.stack);
        return;
      }
      _logger.log('Connected to DB as %d!' + connection.threadId);
    });
    // Store the connection to the database as _instance
    _instance = connection;
  }
}

module.exports = {
  // Classic singleton stuff
  getInstance: (config) => {
    if (_instance) return _instance;
    else {
      _instance = new NodeMysqlSingleton(config);
      return _instance;
    }
  }
};
