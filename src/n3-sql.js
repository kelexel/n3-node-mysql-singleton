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
  const cid = process.env.NODE_ID !== undefined ? process.env.NODE_ID : 0;
  debug('OK CID '+cid+' | Connecting to DB')
  try {
    if (config.pool === true) {
      pool = mysql.createPool(config);
      connection = {};
      connection.query = (sql, values, cb) => {
        pool.getConnection((err, poolConnection) => {
          console.log('getConnection')
          poolConnection.query(sql, values, cb);
          poolConnection.release();
        });
      };

      pool.on('acquire', (connection) => {
        debug('OK CID '+cid+' | Pool connection aquired');
        // console.log('Connection %d acquired', connection.threadId);
      });

      pool.on('connection', (connection) => {
        debug('OK CID '+cid+' | Pool connection init');
        // console.log('Connection %d acquired', connection.threadId);
      });

      pool.on('release', (connection) => {
        debug('OK CID '+cid+' | Pool connection released');
        // console.log('Connection %d acquired', connection.threadId);
      });


    } else {
      connection = mysql.createConnection(config);
      connection.connect((err) => {
        if (err) {
          debug('ERROR CID '+cid+' | Cannot connect to DB!')
          console.error('error connecting: ' + err.stack);
          return;
        }
        debug('OK CID '+cid+' | Connected to DB!')
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
