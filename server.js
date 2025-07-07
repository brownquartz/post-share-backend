// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 4000;
const dbPath = path.join(__dirname, 'posts.db');

// CORS 設定（必要に応じて許可するオリジンを追加）
const corsOptions = {
  origin: [
    'https://brownquartz.github.io',
    'https://post-share-backend-production.up.railway.app',
    'https://post-share-backend-production.up.railway.app/', // Rails way
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight

app.use(express.json()); // JSON ボディのパース

// SQLite DB 接続
const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('Failed to open DB:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite DB.');
});

// テーブル作成（なければ）
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

// 毎回起動時に期限切れ投稿を非表示化
db.run(`
  UPDATE posts
     SET is_visible = 0
   WHERE expire_at <= datetime('now')
`);

// --- ルートハンドラの定義 ---

/**
 * POST /api/posts
 *  新規投稿を作成
 *  body: { id, title, accountId, password, content }
 */
app.post('/api/posts', (req, res) => {
  const { id, title, accountId, password, content } = req.body;
  if (!id || !title || !accountId || !password || !content) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // 7日後に expire
  const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString();

  const stmt = db.prepare(`
    INSERT INTO posts
      (id, title, account_id, password, content, expire_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    title,
    accountId,
    password,
    content,
    expireAt,
    function(err) {
      if (err) {
        console.error('Insert error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ success: true, expireAt });
    }
  );
});

/**
 * GET /api/posts
 *  指定の accountId/password で見える投稿をすべて取得
 *  query: ?accountId=…&password=…
 */
app.get('/api/posts', (req, res) => {
  const { accountId, password } = req.query;
  if (!accountId || !password) {
    return res.status(400).json({ error: 'accountId and password are required.' });
  }

  const sql = `
    SELECT id, title, content, created_at, expire_at
      FROM posts
     WHERE account_id = ?
       AND password = ?
       AND is_visible = 1
       AND expire_at > datetime('now')
     ORDER BY created_at DESC
  `;
  db.all(sql, [accountId, password], (err, rows) => {
    if (err) {
      console.error('Select error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

/**
 * GET /api/posts/:id
 *  単一投稿のコンテンツ取得
 *  query: ?accountId=…&password=…
 */
app.get('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const { accountId, password } = req.query;
  if (!accountId || !password) {
    return res.status(400).json({ error: 'accountId and password are required.' });
  }

  const sql = `
    SELECT content
      FROM posts
     WHERE id = ?
       AND account_id = ?
       AND password = ?
       AND is_visible = 1
       AND expire_at > datetime('now')
  `;
  db.get(sql, [id, accountId, password], (err, row) => {
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

// --- サーバ起動 ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
