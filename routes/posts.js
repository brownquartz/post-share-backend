const express = require('express');
const fs      = require('fs');
const path    = require('path');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();
const dbFile = path.join(__dirname, '../posts.db');

// DB ファイルがなければ作成
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, '');
const db = new sqlite3.Database(dbFile, err => {
  if (err) console.error('DB open error:', err);
});

// テーブルがなければ作成
db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id          TEXT    PRIMARY KEY,
    title       TEXT    NOT NULL,
    accountId   TEXT    NOT NULL,
    password    TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    createdAt   INTEGER NOT NULL,
    expiredAt   INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now','+7 days') AS INTEGER))
  )
`);

// — Create —
router.post('/', (req, res) => {
  const { id, title, accountId, password, content } = req.body;
  if (!id || !title || !accountId || !password || !content) {
    return res.status(400).json({ status:'error', message:'All fields are required' });
  }
  const createdAt = Date.now();
  const expiresAt = createdAt + 7 * 24 * 60 * 60 * 1000; // 7 days from now
  const stmt = db.prepare(`
    INSERT INTO posts (id, title, accountId, password, content, createdAt, expiresAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, title, accountId, password, content, createdAt, expiresAt, err => {
    if (err) return res.status(500).json({ status:'error', message: err.message });
    res.status(201).json({ status:'ok', data:{ id, title, accountId, expiresAt } });
  });
});

// — Read all —
router.get('/', (req, res) => {
  const { accountId, password } = req.query;
  db.all(
    `SELECT id, title, accountId, content, expiresAt
     FROM posts
     WHERE accountId = ? AND password = ?
     ORDER BY createdAt DESC`,
    [accountId, password],
    (err, rows) => {
      if (err) return res.status(500).json({ status:'error', message: err.message });
      res.json(rows);    // 配列だけ返す or { status:'ok', data: rows } に統一
    }
  );
});

// — Read one —
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ status:'error', message: err.message });
    if (!row) return res.status(404).json({ status:'error', message:'Not found' });
    res.json({ status:'ok', data: row });
  });
});

// — Update (例) —
router.put('/:id', (req, res) => {
  const { title, content } = req.body;
  db.run(
    'UPDATE posts SET title = ?, content = ? WHERE id = ?',
    [title, content, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ status:'error', message: err.message });
      if (this.changes === 0) return res.status(404).json({ status:'error', message:'Not found' });
      res.json({ status:'ok', message:'Updated' });
    }
  );
});

// — Delete (例) —
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM posts WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ status:'error', message: err.message });
    if (this.changes === 0) return res.status(404).json({ status:'error', message:'Not found' });
    res.json({ status:'ok', message:'Deleted' });
  });
});

module.exports = router;
