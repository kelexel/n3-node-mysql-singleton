/*
 n3-node-mysql-singleton

 A simple singleton wrapper to node mysql

 author: Rudolph Sand (kelexel)
 licence: MIT

 version: 1.2.0

 For more information about node mysql and pooling (extra settings, events), please read the docs at: https://github.com/mysqljs/mysql#pooling-connections
*/

(function () {
  'use strict';
}());

const mysql = require('mysql');

// Only for testing purposes, leave false otherwise
const forceKeepAlive = false;

// Used to store our object instances
let _instances = {};

// Used as a logging shim
let _logger = {};

// Create a regular db connection
const createRegularConnection = (config, label) => {
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
  return connection;
};

class NodeMysqlSingleton {

  constructor(config, label) {
    label = label !== undefined ? label : 'default';
    // Store logging settings
    this._config = {
      log: config.log,
      onLog: config.onLog
    };

    // Assign a log method to our logger shim, since it's bound to our object, the method scope will have access to this._config
    _logger.log = this._log.bind(this);

    // Reset the pool placeholder
    this.pool = false;

    this.label = label;
    // Create the db pool
    if (config.pool === true)
    this._createPool(config, label);
    else
    console.log('this should not happen')
  }

  acquire(callback) {
      // Aquire a connection from the pool
      if (this._connection) return callback(this._connection);
      this.pool.getConnection(function(err, poolConnection){
        if (err) {
          console.log('error', err);
          return;
        }
        this._connection = poolConection;
        if (callback) callback(poolConnection);
      }.bind(this));
    // }
  }

  // This was removed as it seems out of the scope of this library.
  // You can simply aquire a poolConection and use poolConnection.escape() instead..

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

  release() {
    // If we are in pool mode and a connection exists, release it.
    // if (this.pool !== false && _connection !== false)
    // return _connection.release();
    if (this._connection) {
      console.log('closing', this._connection.threadId)
      this._connection.release();
      this._connection = false;
      delete this._connection;
    }
  }
  destroy() {
    console.log('db.destroy is deprecated ?')
    // If we are in pool mode and a connection exists, release it.
    // if (this.pool !== false && _connection !== false)
    // return _connection.release();
    // if (this._connection) {
    //   console.log('destroying', this._connection.threadId)
    //   this._connection.destroy();
    //   // delete this._connection;
    // }
    // const label = this.label;
    // this.acquire(function(poolConnection) {
    //   // console.log(poolConnection)
    //   // console.log('released',label)
    //   poolConnection.release();
    //   // delete this._connection;
    // }.bind(this));
  }

  query(sql, values, cb, keepAlive) {
      this.acquire(function(connection) {
        connection.query(sql, values, function(error, results, fields) {
          // console.log({sql, keepAlive, forceKeepAlive})
          if (keepAlive !== true && forceKeepAlive !== true) {
            // console.log('release', this.label)
            connection.release();
            this._connection = false;
          } else {
            console.log('Warning, keepAlive is true', this.label, sql)

            _logger.log('Warning, keepAlive is true!', sql);
          }
          cb(error, results, fields);
        }.bind(this));
      }.bind(this));
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

  _createPool(config, label) {
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
        // _logger.log('warning', 'Pool enqued!');
      });
    }
    // Set release pool event
    if (config.onPoolRelease)
    this.pool.on('release', config.onPoolRelease);


    _logger.log('ok', 'Pool '+label+' DB created!');

  }

}

module.exports = {
  // Classic singleton stuff
  getInstance: (config, label) => {
    label = label !== undefined ? label : 'default';
    if (_instances && _instances[label]) {
      // console.log('found', label)
      return _instances[label];
    } else {
      if (config && config.pool)
        _instances[label] = new NodeMysqlSingleton(config, label);
      else {
        _instances[label] = createRegularConnection(config, label);
      }
      return _instances[label];
    }
  }
};
