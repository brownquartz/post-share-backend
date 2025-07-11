// backend/server.js
const express     = require('express');
const cors        = require('cors');
const path        = require('path');
const postsRouter = require('./routes/posts.js');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── 1) 無制限 CORS ───────────────────────────────
app.use(cors());
app.options('*', cors());

// ── 2) ヘルスチェック（スリープ解除用／最上部に） ───
app.get('/__health', (_req, res) => {
  console.log('🟢 Health check');
  res.json({ status: 'ok' });
});

// ── 3) JSON ボディパーサー ＆ API ルート ──────────
app.use(express.json());
app.use('/api/posts', postsRouter);

// ── 4) React build の静的配信 ─────────────────────
const clientBuildPath = path.join(__dirname, '../build');
app.use(express.static(clientBuildPath));

// ── 5) それ以外は全部 index.html ─────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ── 6) サーバー起動 ──────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server up on ${PORT}`);
});
