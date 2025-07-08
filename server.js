// backend/server.js
const express = require('express');
const cors    = require('cors');
const postsRouter = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 4000;

// --- CORS ミドルウェア設定 ---
// オリジンはワイルドカード(*)でも OK ですが、
// 本番では https://brownquartz.github.io や
// https://<あなたのRailwayドメイン> に絞るとより安全です。
app.use(cors({
  origin: [
    'https://brownquartz.github.io',
    'https://post-share-backend-production.up.railway.app'
  ],
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
// プリフライトも cors() を通す
app.options('/{*any}', cors());

// JSON ボディのパース
app.use(express.json());

// ルーター登録
app.use('/api/posts', postsRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
