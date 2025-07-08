// backend/server.js
import express      from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import postsRouter  from './routes/posts.js';

// ESM 環境で __dirname を作る
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 4000;

// JSON ボディ＆API
app.use(express.json());
app.use('/api/posts', postsRouter);

// React build を静的配信（post-share/build を指す）
const clientBuildPath = join(__dirname, '../build');
app.use(express.static(clientBuildPath));

// その他のパスはすべて React の index.html にフォールバック
app.get('*', (req, res) => {
  res.sendFile(join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server up on ${PORT}`);
});
