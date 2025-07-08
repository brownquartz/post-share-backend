// backend/server.js
const express = require('express');
const path    = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// 自前 CORS ヘッダー
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://brownquartz.github.io',
    'https://post-share-backend-production.up.railway.app'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// JSON ボディパース
app.use(express.json());

// ルーター
const postsRouter = require('./routes/posts');
app.use('/api/posts', postsRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
