// n3-sql
// A simple singleton wrapper to node mysql

// author: Rudolph Sand (kelexel)
// licence: MIT

// For more information about node mysql and pooling (extra settings, events), please read the docs at:
// https://github.com/mysqljs/mysql#pooling-connections

const debug = require('debug')('n3-sql')
const mysql = require('mysql');

let connection = false;
let pool = false;

const initianlizeDB = (config) => {

  const logOkPrefix = config.logOkPrefix || '';
  const logErrorPrefix = config.logOkPrefix || '';

  debug('%sConnecting to DB', logOkPrefix)
  try {
    if (config.pool === true) {
      pool = mysql.createPool(config);
      connection = {};

      connection.acquire = (callback) => {
        if (connection.previousConnection) {
          if (callback)
            return callback(connection.previousConnection);
        } else
        pool.getConnection((err, poolConnection) => {
          debug('%sNew poolConnection %d', logOkPrefix, poolConnection.threadId);
          connection.previousConnection = poolConnection;
          if (callback) callback(poolConnection);
        });
      }

      connection.escape = (str, callback) => {
        if (connection.previousConnection)
          return connection.previousConnection.escape(str);
        else {
          if (!callback) {
            console.log('no callback ?!')
            return;
          }
          pool.getConnection((err, poolConnection) => {
            debug('%sNew poolConnection %d', logOkPrefix, poolConnection.threadId);
            connection.previousConnection = poolConnection;
            callback(poolConnection.escape(str));
          });
        }
      }

      connection.release = () => {
        if (connection.previousConnection)
          return connection.previousConnection.release();
      }

      connection.query = (sql, values, cb, keepAlive) => {
        if (connection.previousConnection) {
          debug('%sUsing previous poolConnection %d',logOkPrefix, connection.previousConnection.threadId);
          connection.previousConnection.query(sql, values, cb);
          if (keepAlive !== true) {
            connection.previousConnection.release();
            delete connection.previousConnection;
          }
        } else {
          pool.getConnection((err, poolConnection) => {
            debug('%sNew poolConnection %d', logOkPrefix, poolConnection.threadId);
            poolConnection.query(sql, values, cb);
            if (keepAlive !== true) {
              poolConnection.release();
              if (connection.previousConnection) delete connection.previousConnection;
            } else
              connection.previousConnection = poolConnection;
          });
        }
      };

      if (config.onPoolAquire)
      pool.on('acquire', config.onPoolAquire);

      if (config.onPoolConnection)
      pool.on('connection', config.onPoolConnection);

      if (config.onPoolRelease)
      pool.on('connection', config.onPoolRelease);
      else
      pool.on('release', (connection) => {
        debug('%sReleasing pool connection %d', logOkPrefix, connection.threadId);
      });


    } else {
      connection = mysql.createConnection(config);
      connection.connect((err) => {
        if (err) {
          debug('%sCannot connect to DB!', logErrorPrefix)
          console.error('error connecting: ' + err.stack);
          return;
        }
        debug('%sConnected to DB!', logOkPrefix)
        // console.log('connected as id ' + connection.threadId);
      });
    }
  } catch(e) {
    console.log(e)
  }
  return connection;

}

module.exports = {
  getInstance: (config) => {
    if (connection) return connection;
    else return initianlizeDB(config);
  }
};
