// backend/server.js の一番上に追加
const express = require('express');
const path    = require('path');
const postsRouter = require('./routes/posts.js');

const app = express();

// ↓↓↓ CORSヘッダーを強制インジェクトするミドルウェア ↓↓↓
app.use((req, res, next) => {
  // すべてのリクエストに対して常にこのヘッダーを付与
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // プリフライト(OPTIONS)の場合は 200 だけ返して終わり
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// JSON パーサー & API
app.use(express.json());
app.use('/api/posts', postsRouter);

// React build の静的配信（案Aの構成のままなら）
const clientBuildPath = path.join(__dirname, '../build');
app.use(express.static(clientBuildPath));
app.get('*', (_, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server up on ${PORT}`));
