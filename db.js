// db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway の Postgres は自己署名証明書なので
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
