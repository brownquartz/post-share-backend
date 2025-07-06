// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 4000;
const dbPath = path.join(__dirname, 'posts.db');

// ミドルウェア設定
app.use(cors());
app.use(express.json());

// DB 接続とマイグレーション
const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    account_id TEXT NOT NULL,
    password TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expire_at DATETIME NOT NULL,
    is_visible INTEGER DEFAULT 1
  );
`);
// 期限切れフラグ更新
const expireStmt = db.prepare(`
  UPDATE posts
    SET is_visible = 0
    WHERE expire_at <= datetime('now')
`);
expireStmt.run();

// POST /api/posts
app.post('/api/posts', (req, res) => {
  const { id, title, accountId, password, content } = req.body;
  const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const insertStmt = db.prepare(`
    INSERT INTO posts (id, title, account_id, password, content, expire_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  try {
    insertStmt.run(id, title, accountId, password, content, expireAt);
    res.status(201).json({ success: true, expireAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts?accountId=…&password=…
app.get('/api/posts', (req, res) => {
  const { accountId, password } = req.query;
  const selectStmt = db.prepare(`
    SELECT id, title, content, created_at, expire_at
      FROM posts
     WHERE account_id = ?
       AND password = ?
       AND is_visible = 1
       AND expire_at > datetime('now')
     ORDER BY created_at DESC
  `);
  try {
    const rows = selectStmt.all(accountId, password);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:id?accountId=…&password=…
app.get('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const { accountId, password } = req.query;
  const getStmt = db.prepare(`
    SELECT content
      FROM posts
     WHERE id = ?
       AND account_id = ?
       AND password = ?
       AND is_visible = 1
       AND expire_at > datetime('now')
  `);
  try {
    const row = getStmt.get(id, accountId, password);
    if (!row) return res.status(401).json({ error: 'Invalid credentials or expired' });
    res.json({ content: row.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// サーバ起動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
