// backend/routes/auth.js
const express = require('express');
const bcrypt  = require('bcrypt');
const pool    = require('../db');
const router  = express.Router();

// サインアップ
router.post('/signup', async (req, res) => {
  const { username, password, passwordConfirm } = req.body;
  if (!username || !password || password !== passwordConfirm) {
    return res.status(400).json({ status:'error', message:'入力チェックに失敗しました' });
  }
  try {
    // 重複チェック
    const { rowCount } = await pool.query(
      'SELECT 1 FROM users WHERE username=$1', [username]
    );
    if (rowCount) {
      return res.status(409).json({ status:'error', message:'ユーザー名が既に使われています' });
    }
    // パスワードハッシュ化
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (
         username,
         password_hash,
         type,
         oauth_provider,
         expired_at
       )
       VALUES (
         $1,      -- username
         $2,      -- hash
         'local', -- サインアップ時はローカル
         '',      -- OAuth 未使用なので空文字
         NOW() + INTERVAL '1 day'  -- サインアップ後1日で失効
       )
       RETURNING id, username, type, oauth_provider, created_at, expired_at`,
      [username, hash]
    );
    res.status(201).json({ status:'ok', user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status:'error', message:err.message });
  }
});

// ログイン
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status:'error', message:'入力が足りません' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id, password_hash FROM users WHERE username = $1',
      [username]
    );
    if (!rows[0] || !await bcrypt.compare(password, rows[0].password_hash)) {
      return res.status(401).json({ status:'error', message:'認証に失敗しました' });
    }
    // TODO: セッション or JWT 発行
    res.json({ status:'ok', userId: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status:'error', message:err.message });
  }
});

module.exports = router;
