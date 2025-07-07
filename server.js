// backend/server.js
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS の設定（プリフライト OPTIONS も通す）
app.use(cors({
  origin: [
    'https://brownquartz.github.io',                      // フロントの GitHub Pages
    'https://post-share-backend-production.up.railway.app' // Railway 側のドメイン
  ],
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
// app.options('*', cors());   // 全パスのプリフライト対応

// JSON ボディのパース（必ずルーターより前）
app.use(express.json());

// posts 用ルーターをマウント
const postsRouter = require('./routes/posts');
app.use('/api/posts', postsRouter);

// サーバ起動
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
