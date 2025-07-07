const express = require('express');
const path    = require('path');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'posts.db');

// DB を開く（存在しなければ新規作成）
const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('DB open error:', err);
    process.exit(1);
  }
});

// テーブルがなければ作る
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    account_id  TEXT NOT NULL,
    password    TEXT NOT NULL,
    content     TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    expire_at   DATETIME NOT NULL,
    is_visible  INTEGER DEFAULT 1
  );
`);

// サーバ起動時に期限切れもしくは非表示フラグが立っているものを隠す
db.run(`
  UPDATE posts
     SET is_visible = 0
   WHERE expire_at <= datetime('now')
`);

/**
 * POST /api/posts
 */
router.post('/', (req, res) => {
  const { id, title, accountId, password, content } = req.body;
  if (!id || !title || !accountId || !password || !content) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // 7日後に自動で期限切れ
  const expireAt = new Date(Date.now() + 7*24*60*60*1000).toISOString();

  const stmt = db.prepare(`
    INSERT INTO posts (id, title, account_id, password, content, expire_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, title, accountId, password, content, expireAt, function(err) {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ success: true, expireAt });
  });
});

/**
 * GET /api/posts?accountId=…&password=…
 */
router.get('/', (req, res) => {
  const { accountId, password } = req.query;
  if (!accountId || !password) {
    return res.status(400).json({ error: 'accountId and password are required.' });
  }

  db.all(`
    SELECT id, title, content, created_at, expire_at
      FROM posts
     WHERE account_id = ?
       AND password    = ?
       AND is_visible  = 1
       AND expire_at  > datetime('now')
     ORDER BY created_at DESC
  `, [accountId, password], (err, rows) => {
    if (err) {
      console.error('Select error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

/**
 * GET /api/posts/:id?accountId=…&password=…
 */
router.get('/:id', (req, res) => {
  const { accountId, password } = req.query;
  const { id } = req.params;
  if (!accountId || !password) {
    return res.status(400).json({ error: 'accountId and password are required.' });
  }

  db.get(`
    SELECT content
      FROM posts
     WHERE id          = ?
       AND account_id  = ?
       AND password    = ?
       AND is_visible  = 1
       AND expire_at  > datetime('now')
  `, [id, accountId, password], (err, row) => {
    if (err) {
      console.error('Get error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(401).json({ error: 'Invalid credentials or expired.' });
    }
    res.json({ content: row.content });
  });
});

module.exports = router;
