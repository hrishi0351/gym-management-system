'use strict';

const sql = require('mssql');
const config = require('./env');
const logger = require('../utils/logger');

const pool = new sql.ConnectionPool({
  server: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  pool: { max: config.db.connectionLimit, min: 0, idleTimeoutMillis: 30000 },
  requestTimeout: 30000,
  options: {
    encrypt: config.db.encrypt,
    trustServerCertificate: config.db.trustServerCertificate,
    enableArithAbort: true,
  },
});

pool.on('error', (err) => logger.error('SQL Server pool error', { code: err.code }));

let connecting = null;
function connect() {
  if (!connecting) {
    connecting = pool.connect().catch((err) => {
      connecting = null; // allow retry
      throw err;
    });
  }
  return connecting;
}

/**
 * Converts "?" placeholders into @p0, @p1... and binds the values.
 * User input must ONLY go through `params`, never string concatenation.
 */
async function run(request, sqlText, params) {
  let index = 0;
  const text = sqlText.replace(/\?/g, () => `@p${index++}`);
  if (index !== params.length) {
    throw new Error(`Query expects ${index} parameters but got ${params.length}`);
  }
  params.forEach((value, i) => {
    if (value === undefined) throw new Error(`Query parameter ${i} is undefined (use null)`);
    request.input(`p${i}`, value);
  });
  return request.query(text);
}

/** Returns an array of rows.  Example: await query('SELECT * FROM users WHERE email = ?', [email]) */
async function query(sqlText, params = []) {
  await connect();
  const result = await run(pool.request(), sqlText, params);
  return result.recordset || [];
}

/** Returns { rows, rowsAffected } for INSERT/UPDATE/DELETE (use OUTPUT INSERTED.id to get new ids) */
async function execute(sqlText, params = []) {
  await connect();
  const result = await run(pool.request(), sqlText, params);
  return {
    rows: result.recordset || [],
    rowsAffected: result.rowsAffected.reduce((a, b) => a + b, 0),
  };
}

/**
 * Runs several queries atomically; anything thrown rolls everything back.
 *   await withTransaction(async (tx) => {
 *     const rows = await tx.query('SELECT ...', [..]);
 *     await tx.execute('UPDATE ...', [..]);
 *   });
 */
async function withTransaction(callback) {
  await connect();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  const tx = {
    query: async (t, p = []) => (await run(new sql.Request(transaction), t, p)).recordset || [],
    execute: async (t, p = []) => {
      const r = await run(new sql.Request(transaction), t, p);
      return { rows: r.recordset || [], rowsAffected: r.rowsAffected.reduce((a, b) => a + b, 0) };
    },
  };
  try {
    const result = await callback(tx);
    await transaction.commit();
    return result;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (_) {
      /* already rolled back */
    }
    throw error;
  }
}

async function testConnection() {
  const rows = await query('SELECT 1 AS ok');
  return rows[0].ok === 1;
}

async function close() {
  await pool.close();
}

module.exports = { pool, query, execute, withTransaction, testConnection, close };