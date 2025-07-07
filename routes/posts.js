// backend/routes/posts.js
const express = require('express');
const router  = express.Router();
const sqlite3 = require('sqlite3').verbose();

// ./posts.db が存在しなければ同じディレクトリに作成されます
const db = new sqlite3.Database(process.env.DB_FILE || './posts.db');

// テーブルがなければ作っておく
db.run(`CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT,
  accountId TEXT,
  password TEXT,
  content TEXT,
  expiresAt INTEGER
)`);

// GET /api/posts?accountId=xxx&password=yyy
router.get('/', (req, res) => {
  const { accountId, password } = req.query;
  db.all(
    `SELECT * FROM posts WHERE accountId = ? AND password = ?`,
    [accountId, password],
    (err, rows) => {
      if (err) return res.status(500).json({ status:'error', message:err.message });
      res.json({ status:'ok', data: rows });
    }
  );
});

// POST /api/posts
router.post('/', (req, res) => {
  const { id, title, accountId, password, content } = req.body;
  const expiresAt = Date.now() + 1000*60*60*24; // 24h 後
  db.run(
    `INSERT INTO posts (id,title,accountId,password,content,expiresAt)
     VALUES (?,?,?,?,?,?)`,
    [id,title,accountId,password,content,expiresAt],
    function(err) {
      if (err) return res.status(500).json({ status:'error', message:err.message });
      res.json({ status:'ok', id, expiresAt });
    }
  );
});

module.exports = router;
