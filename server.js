// backend/server.js
require('dotenv').config();
// 環境変数 DATABASE_URL の確認（Postgres 接続文字列）
console.log('▶ ENV DATABASE_URL =', process.env.DATABASE_URL);

const express = require('express');
const path = require('path');
const cors = require('cors');

const pool = require('./db.js');         // PostgreSQL プールを初期化
const postsRouter = require('./routes/posts.js');

const app = express();

// 環境変数からポートを取得（なければ 8080）
console.log('▶ ENV PORT =', process.env.PORT);
const port = parseInt(process.env.PORT, 10) || 8080;

// リクエストロガー
app.use((req, res, next) => {
  console.log(`▶ REQUEST ${req.method} ${req.url}`);
  next();
});

// CORS 設定
app.use(cors());
app.options('*', cors());

// テスト用エンドポイント
app.get('/test', (_req, res) => {
  console.log('● /test called');
  res.status(200).send('OK');
});

// ヘルスチェック
app.get('/__health', (_req, res) => {
  console.log('● Health check');
  res.json({ status: 'ok' });
});

// JSON ボディパーサー
app.use(express.json());

// API ルート
app.use('/api/posts', postsRouter);

// 登録済みルート一覧をログ出力
console.log('▶ ROUTES:', app._router.stack
  .filter(r => r.route)
  .map(r => r.route.path)
);

// サーバー起動
app.listen(port, () => {
  console.log(`🚀 Server is running on ${port}`);
});
