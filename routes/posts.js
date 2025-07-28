// routes/posts.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');  // ①

// 一覧取得
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM posts');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 詳細取得
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM posts WHERE id = $1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 新規作成
router.post('/', async (req, res) => {
  const { title, content, accountId } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO posts (title, content, accountid)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, content, accountId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 更新
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const { rowCount } = await pool.query(
      `UPDATE posts
       SET title = $1, content = $2
       WHERE id = $3`,
      [title, content, id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Not found' });
    }
    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 削除
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM posts WHERE id = $1',
      [id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Not found' });
    }
    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
