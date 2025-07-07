// backend/server.js
const express = require('express');
const cors    = require('cors');
const postsRouter = require('./routes/posts');

const app  = express();
const PORT = process.env.PORT || 4000;

const corsOptions = {
  origin: [
    'https://brownquartz.github.io',                       // GitHub Pages からのアクセス
    'https://post-share-backend-production.up.railway.app' // Railway の エンドポイント
  ],
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type']
};

// ① JSON ボディを parse
app.use(express.json());

// ② CORS ミドルウェア（OPTIONS もここで拾う）
app.use(cors(corsOptions));

// ③ posts ルーターをマウント
app.use('/api/posts', postsRouter);

// ④ サーバ起動
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
