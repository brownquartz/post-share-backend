// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 4000;
const dbPath = path.join(__dirname, 'posts.db');

const corsOptions = {
  origin: 'https://brownquartz.github.io',   // your GH Pages URL
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));  // preflight をキャッチ

// ミドルウェア設定
app.use(express.json());

// DB 接続とマイグレーション
const db = new sqlite3.Database(dbPath, err => {
  if (err) console.error('DB open error:', err);
});
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

  const stmt = db.prepare(
    `INSERT INTO posts (...)
    VALUES (?, ?, ?, ?, ?, ?)`
  );
  stmt.run(id, title, accountId, password, content, expireAt, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ success: true, expireAt });
  });
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
