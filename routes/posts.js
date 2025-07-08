// backend/routes/posts.js
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const Database = require('better-sqlite3');

// SQLite ファイルは同ディレクトリ直下に `posts.db`
const dbPath = path.resolve(__dirname, '../posts.db');
const db = new Database(dbPath);

// テーブルがなければ作成
db.prepare(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    accountId TEXT NOT NULL,
    password TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  )
`).run();

const router = express.Router();

// 全件取得
router.get('/', (req, res) => {
  const stmt = db.prepare(`SELECT id, title, accountId, createdAt FROM posts ORDER BY createdAt DESC`);
  const posts = stmt.all();
  res.json({ status:'ok', data: posts });
});

// 単一取得
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare(`SELECT * FROM posts WHERE id = ?`);
  const post = stmt.get(id);
  if (!post) return res.status(404).json({ status:'error', code:404, message:'Not found' });
  res.json({ status:'ok', data: post });
});

// 登録
router.post('/', (req, res) => {
  const { id, title, accountId, password, content } = req.body;
  if (!id || !title || !accountId || !password || !content) {
    return res.status(400).json({ status:'error', code:400, message:'All fields are required' });
  }
  const createdAt = Date.now();
  const stmt = db.prepare(`
    INSERT INTO posts (id, title, accountId, password, content, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  try {
    stmt.run(id, title, accountId, password, content, createdAt);
    res.json({ status:'ok', data:{ id, title, accountId, createdAt } });
  } catch (e) {
    res.status(500).json({ status:'error', code:500, message:'DB error' });
  }
});

module.exports = router;
