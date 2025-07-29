// routes/posts.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const crypto  = require('crypto');

// AES 暗号化設定
const algorithm = 'aes-256-cbc';
const secretKey = process.env.PASSWORD_SECRET || 'default_secret';
const key       = crypto.createHash('sha256').update(secretKey).digest();

// テキストを暗号化 (Base64 出力)
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, encrypted]).toString('base64');
}

// 暗号文を復号
function decrypt(data) {
  const bData = Buffer.from(data, 'base64');
  const iv = bData.slice(0, 16);
  const encryptedText = bData.slice(16);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString('utf8');
}

// 投稿一覧取得 (camelCase キーと日時フィールドを返す)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         title,
         content,
         accountid AS "accountId",
         password,
         created_at AS "createdAt",
         expires_at AS "expiresAt"
       FROM posts
       ORDER BY id ASC`
    );
    // パスワードは復号、コンテンツはそのまま暗号文を返却
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

// 投稿詳細取得
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         title,
         content,
         accountid AS "accountId",
         password,
         created_at AS "createdAt",
         expires_at AS "expiresAt"
       FROM posts WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Not found' });
    }
    const post = rows[0];
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
  const encryptedPassword = password ? encrypt(password) : '';
  try {
    const { rows } = await pool.query(
      `INSERT INTO posts (title, content, accountid, password)
       VALUES ($1, $2, $3, $4)
       RETURNING
         id,
         title,
         content,
         accountid AS "accountId",
         password,
         created_at AS "createdAt",
         expires_at AS "expiresAt"`,
      [title, content, accountId, encryptedPassword]
    );
    const post = rows[0];
    post.password = post.password ? decrypt(post.password) : '';
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 更新
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, content, password } = req.body;
  const encryptedPassword = password !== undefined ? encrypt(password) : undefined;
  const fields = ['title = $1', 'content = $2'];
  const values = [title, content];
  if (encryptedPassword !== undefined) {
    fields.push(`password = $${values.length + 1}`);
    values.push(encryptedPassword);
  }
  values.push(id);
  const query = `UPDATE posts SET ${fields.join(', ')} WHERE id = $${values.length}`;
  try {
    const { rowCount } = await pool.query(query, values);
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
  const id = parseInt(req.params.id, 10);
  try {
    const { rowCount } = await pool.query('DELETE FROM posts WHERE id = $1', [id]);
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
