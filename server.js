// backend/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app    = express();
const PORT   = process.env.PORT || 4000;
const dbFile = path.join(__dirname, 'posts.db');

// ミドルウェア
app.use(cors());
app.use(express.json());

// DB 接続
const db = new Database(dbFile, (err) => {
  if (err) return console.error(err);
  console.log('Connected to SQLite database.');

  // マイグレーション：テーブルを作成
  db.exec(`
  DROP TABLE IF EXISTS posts;

  CREATE TABLE posts (
    id          TEXT    PRIMARY KEY,
    title       TEXT    NOT NULL,        -- 追加
    account_id  TEXT    NOT NULL,
    password    TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    expire_at   DATETIME NOT NULL,
    is_visible  INTEGER  DEFAULT 1
  );
`, err => {
  if (err) return console.error('Migration error:', err);

  // 古いフラグを更新（期限切れは非表示）
  db.run(`
    UPDATE posts
       SET is_visible = 0
     WHERE expire_at <= datetime('now')
  `, err2 => {
    if (err2) console.error('Expire flag update error', err2);
  });
});
});

app.post('/api/posts', (req, res) => {
  const { id, title, accountId, password, content } = req.body;
  const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.run(
    `INSERT INTO posts(
       id, title, account_id, password, content, expire_at
     ) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, title, accountId, password, content, expireAt],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ success: true, expireAt });
    }
  );
});

// GET /api/posts?accountId=…&password=…
app.get('/api/posts', (req, res) => {
  const { accountId, password } = req.query;
  db.all(
    `SELECT id, title, content, created_at, expire_at
     FROM posts
     WHERE account_id = ? AND password = ?
       AND is_visible = 1
       AND expire_at > datetime('now')
     ORDER BY created_at DESC`,
    [accountId, password],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// GET /api/posts/:id?accountId=…&password=…
app.get('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const { accountId, password } = req.query;
  db.get(
    `SELECT content
     FROM posts
     WHERE id = ? AND account_id = ? AND password = ?
       AND is_visible = 1
       AND expire_at > datetime('now')`,
    [id, accountId, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: 'Invalid credentials or expired' });
      res.json({ content: row.content });
    }
  );
});

// サーバ起動
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
