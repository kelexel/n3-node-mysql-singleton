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

let _instance;
let _connection = false;

// class Logger {
//   constructor() {
//   this._logOkPrefix = '';
//   this._logErrorPrefix = '';
//   this._loggingFacility = false;
//   }
//   log(status, message) {
//     if (!this._loggingFacility) console.log(status, message);
//     else {
//       if (status == 'ok')
//         this._loggingFacility(this._logOkPrefix+' | '+message)
//       else
//         this._loggingFacility(this._logErrorPrefix+' | '+message)
//     }
//   }
//   setFacility(config) {
//     this._logOkPrefix = config.logOkPrefix || 'Ok';
//     this._logErrorPrefix = config.logErrorPrefix || 'Error';
//     this._loggingFacility = config.loggingFacility;
//     this.log('ok', 'Log Facility set!');
//     return this;
//   }
// }
const _logger = require('n3-node-logger')();

class NodeMysqlSingleton {

  constructor(config) {
    // this.config = config;
    this.config = {};

    if (config.loggingFacility) {
      _logger.setFacility(config);
    }

    this.pool = false;

    if (config.pool === true)
    this._createPool(config);
    else
    this._createConnection(config);
  }

  acquire(callback) {
    if (_connection !== false && this.pool !== false) {
      if (callback)
      return callback(_connection);
    } else {

      this.pool.getConnection((err, poolConnection) => {
        if (err) {
          console.log('error', err);
          return;
        }
        _logger.log('ok', 'New poolConnection '+ poolConnection.threadId);
        _connection = poolConnection;
        if (callback) callback(poolConnection);
      });
    }
  }

  escape(str, callback) {
    if (this.pool !== false) {
      return _connection !== false ? _connection.escape(str) : false;
    }
    if (!callback) {
      _logger.log('error', 'No escape callback providden, cannot return escaped value!' + _connection.threadId);
      return;
    }

    this.acquire((poolConnection) => {
      callback(_connection.escape(str));
    });
  }

  release() {
    if (this.pool !== false && _connection !== false)
    return _connection.release();
  }

  query(sql, values, cb, keepAlive) {
    if (this.pool === false) {
      return _connection !== false ? _connection.query(sql, values, cb) : false;
    }

    if (_connection !== false) {
      _logger.log('ok', 'Using previous poolConnection ' + _connection.threadId);
      _connection.query(sql, values, cb);
      if (keepAlive !== true) {
        _connection.release();
        _connection = false;
      }
    } else {
      this.acquire(() => {
        _connection.query(sql, values, cb);
        if (keepAlive !== true) {
          _connection.release();
          _connection = false;
        }
      });
    }
  }

  _createPool(config) {
    this.pool = mysql.createPool(config);

    if (config.onPoolAquire)
    this.pool.on('acquire', config.onPoolAquire);

    if (config.onPoolConnection)
    this.pool.on('connection', config.onPoolConnection);

    if (config.onPoolRelease)
    this.pool.on('connection', config.onPoolRelease);
    else {
      const logOkPrefix = this.config.logOkPrefix;
      this.pool.on('release', (connection) => {
        _logger.log('ok', 'Releasing pool connection ' + connection.threadId);
      });
    }
  }

  _createConnection(config) {
    const connection = mysql.createConnection(config);
    connection.connect((err) => {
      if (err) {
        _logger.log('error', 'Cannot connect to DB!');
        console.error('error connecting: ' + err.stack);
        return;
      }
      _logger.log('Connected to DB as %d!' + connection.threadId);
    });
    _instance = connection;
  }
}

module.exports = {
  getInstance: (config) => {
    if (_instance) return _instance;
    else {
      _instance = new NodeMysqlSingleton(config);
      return _instance;
    }
  }
};
