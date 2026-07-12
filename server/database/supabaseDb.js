import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// Use the DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper to convert SQLite syntax to Postgres
function convertSql(sql) {
  let i = 1;
  // Replace ? with $1, $2, etc.
  let converted = sql.replace(/\?/g, () => '$' + (i++));
  
  // If it's an INSERT statement without RETURNING, append RETURNING id
  if (/^\s*INSERT\s+INTO/i.test(converted) && !/RETURNING/i.test(converted)) {
    converted += ' RETURNING id';
  }

  return converted;
}

const db = {
  pool,
  
  run(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const pgSql = convertSql(sql);
    
    pool.query(pgSql, params || [])
      .then(res => {
        if (callback) {
          const context = {
            changes: res.rowCount,
            lastID: res.rows && res.rows.length > 0 ? res.rows[0].id : null
          };
          callback.apply(context, [null]);
        }
      })
      .catch(err => {
        if (callback) {
          callback(err);
        } else {
          console.error('DB Run Error:', err);
        }
      });
    return this;
  },
  
  get(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const pgSql = convertSql(sql);
    
    pool.query(pgSql, params || [])
      .then(res => {
        if (callback) {
          callback(null, res.rows.length > 0 ? res.rows[0] : undefined);
        }
      })
      .catch(err => {
        if (callback) {
          callback(err, null);
        } else {
          console.error('DB Get Error:', err);
        }
      });
    return this;
  },
  
  all(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const pgSql = convertSql(sql);
    
    pool.query(pgSql, params || [])
      .then(res => {
        if (callback) {
          callback(null, res.rows);
        }
      })
      .catch(err => {
        if (callback) {
          callback(err, null);
        } else {
          console.error('DB All Error:', err);
        }
      });
    return this;
  },
  
  serialize(callback) {
    callback();
  }
};

export default db;
