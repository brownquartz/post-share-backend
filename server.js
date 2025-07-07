const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// JSON のパースと CORS 設定はルーターマウントの前に
app.use(express.json());
app.use(cors({
  origin: [
    'https://brownquartz.github.io',                     // GitHub Pages 版フロント
    'https://post-share-backend-production.up.railway.app' // Railway デプロイ版バックエンド（必要に応じて追加）
  ]
}));

// posts 用ルーターを /api/posts 以下にマウント
const postsRouter = require('./routes/posts');
app.use('/api/posts', postsRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
