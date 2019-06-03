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

let _logger = {};

class NodeMysqlSingleton {

  constructor(config) {
    // this._config = config;
    this._config = {
      log: config.log,
      onLog: config.onLog
    };

    _logger.log = this._log.bind(this);

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

  _log(status, message) {
    if (!this._config.log) return;
    if (this._config.onLog) this._config.onLog(status, message);
    else
    console.log(status, message);
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
      const logOkPrefix = this._config.logOkPrefix;
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
