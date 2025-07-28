const express = require('express');
const path    = require('path');
const cors    = require('cors');
const postsRouter = require('./routes/posts.js');

const app  = express();
// const PORT = process.env.PORT;
const port = parseInt(process.env.PORT, 10) || 8080;

app.use((req, res, next) => {
  console.log(`▶ REQUEST ${req.method} ${req.url}`);
  next();
});

// CORS
app.use(cors());
app.options('*', cors());

app.get('/test', (_req, res) => {
  console.log('● /test called');
  res.status(200).send('OK');
});

// 1) ヘルスチェック: アンダースコア２個に修正
app.get('/__health', (req, res) => {
  console.log('● Health check');
  res.json({ status: 'ok' });
});

// 2) JSON ボディパーサー & API
app.use(express.json());
app.use('/api/posts', postsRouter);

// // 3) 静的ファイル配信: build は同階層なので __dirname + '/build'
// const clientBuildPath = path.join(__dirname, 'build');
// app.use(express.static(clientBuildPath));

// // 4) それ以外は index.html へフォールバック
// app.get('*', (_req, res) => {
//   res.sendFile(path.join(clientBuildPath, 'index.html'));
// });

// 5) サーバー起動
console.log('▶ LISTENING ON PORT', port);
app.listen(port, () => {
  console.log(`🚀 Server is running on ${port}`);
});