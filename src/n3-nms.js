// n3-sql
// A simple singleton wrapper to node mysql

// author: Rudolph Sand (kelexel)
// licence: MIT

// For more information about node mysql and pooling (extra settings, events), please read the docs at:
// https://github.com/mysqljs/mysql#pooling-connections

const debug = require('debug')('n3-nms')
const mysql = require('mysql');

let _instance;
let _connection;

class NMS {

  constructor(config) {
    // this.config = config;
    this.config = {}
    this.pool = false;
    this.config.logOkPrefix = config.logOkPrefix || '';
    this.config.logErrorPrefix = config.logOkPrefix || '';

    _instance = {};
    _connection = false;

    if (config.pool === true)
    this._createPool(config)
    else
    this._createConnection(config);
  }

  acquire(callback) {
    if (_connection !== false && this.pool !== false) {
      if (callback)
      return callback(_connection);
    } else {
      const logOkPrefix = this.config.logOkPrefix;

      this.pool.getConnection((err, poolConnection) => {
        if (err) console.log('error', err)
        debug('%sNew poolConnection#4 %d', this.config.logOkPrefix, poolConnection.threadId);
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
      console.log('no callback ?!')
      return;
    }

    const logOkPrefix = this.config.logOkPrefix;

    this.acquire((poolConnection) => {
      debug('%sNew poolConnection#5 %d', logOkPrefix, poolConnection.threadId);
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
      debug('%sUsing previous poolConnection %d',this.config.logOkPrefix, _connection.threadId);
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
        debug('%sReleasing pool connection %d', logOkPrefix, connection.threadId);
      });
    }
  }

  _createConnection(config) {
    const connection = mysql.createConnection(config);
    connection.connect((err) => {
      if (err) {
        debug('%sCannot connect to DB!', logErrorPrefix)
        console.error('error connecting: ' + err.stack);
        return;
      }
      debug('%sConnected to DB as %d!', logOkPrefix, connection.threadId)
    });
    _instance = connection;
  }
}

module.exports = {
  getInstance: (config) => {
    if (_instance) return _instance;
    else {
      _instance = new NMS(config);
      return _instance;
    }
  }
};
