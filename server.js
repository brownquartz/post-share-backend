// backend/server.js
const express     = require('express');
const path        = require('path');
const postsRouter = require('./routes/posts.js');

const app  = express();
const PORT = process.env.PORT || 4000;

// JSON パーサー & API ルート
app.use(express.json());
app.use('/api/posts', postsRouter);

// React build を静的配信（post-share/build を指す）
const clientBuildPath = path.join(__dirname, '../build');
app.use(express.static(clientBuildPath));

// それ以外はすべて React の index.html にフォールバック
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server up on ${PORT}`);
});
