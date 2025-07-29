// routes/posts.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { v4: uuidv4 } = require('uuid');
const crypto  = require('crypto');

// 暗号化設定
const algorithm = 'aes-256-cbc';
const secretKey = process.env.PASSWORD_SECRET || 'default_secret';
const key       = crypto.createHash('sha256').update(secretKey).digest();

// テキストを暗号化
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// 暗号文を復号
function decrypt(data) {
  const [ivHex, encrypted] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 一覧取得
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM posts');
    // password を復号して返却
    const result = rows.map(row => ({
      ...row,
      password: row.password ? decrypt(row.password) : ''
    }));
    res.json(result);
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
    const post = rows[0];
    // password を復号
    post.password = post.password ? decrypt(post.password) : '';
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 新規作成
router.post('/', async (req, res) => {
  const { title, content, accountId, password } = req.body;
  const id = uuidv4();
  // password を暗号化
  const encryptedPassword = password ? encrypt(password) : '';
  try {
    const { rows } = await pool.query(
      `INSERT INTO posts (id, title, content, accountid, password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, title, content, accountId, encryptedPassword]
    );
    const post = rows[0];
    // レスポンス時は復号して返却
    post.password = decrypt(post.password);
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 更新
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, password } = req.body;
  // password 更新時は暗号化
  const encryptedPassword = password ? encrypt(password) : undefined;
  const fields = ['title', 'content', encryptedPassword !== undefined ? 'password' : null]
    .filter(Boolean);
  const values = [title, content];
  if (encryptedPassword !== undefined) values.push(encryptedPassword);
  values.push(id);
  const setClause = fields.map((f, i) => `${f} = $${i+1}`).join(', ');

  try {
    const { rowCount } = await pool.query(
      `UPDATE posts SET ${setClause} WHERE id = $${values.length}`,
      values
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
